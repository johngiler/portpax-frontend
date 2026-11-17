#!/usr/bin/env bash
#
# One-time PRODUCTION frontend host setup (ITM AWS EC2). Run as root via Session Manager.
# Serves the Next.js static export behind the ALB on :80 (TLS terminates at the LB).
# Build happens in GitHub Actions; this host pulls release artifacts (S3) and serves out/.
# App path: /home/git/frontend (DEV shared host uses /home/git/portpax).
#
# After this script:
#   1. Place static export at /home/git/frontend/out (Actions/SSM or aws s3 sync)
#   2. Install nginx site for portpax.itmgroup.mx (listen 80 only; no Certbot)
#      ALB health check expects HTTP 200 on /
#   3. nginx -t && systemctl reload nginx
#   4. Ops tmux (nginx logs + btop):
#        cp scripts/systemd/tmux.service /etc/systemd/system/tmux.service
#        systemctl daemon-reload && systemctl enable --now tmux.service
#      Attach: sudo -u git tmux attach -t portpax-fe-ops
#
# DEV bootstrap: ./scripts/setup-dev.sh
#

set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: run as root (sudo $0)" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
APP_ROOT="/home/git/frontend"
OUT_DIR="${APP_ROOT}/out"

install_awscli_v2() {
  if command -v aws >/dev/null 2>&1; then
    echo "[setup-prod] awscli already present: $(aws --version 2>&1)"
    return 0
  fi
  echo "[setup-prod] Installing AWS CLI v2..."
  local tmp
  tmp="$(mktemp -d)"
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
    -o "${tmp}/awscliv2.zip"
  unzip -q "${tmp}/awscliv2.zip" -d "${tmp}"
  "${tmp}/aws/install"
  rm -rf "${tmp}"
}

echo "[setup-prod] Updating apt..."
apt-get update -qq

echo "[setup-prod] Installing system packages..."
apt-get install -y \
  nginx \
  git \
  rsync \
  curl \
  unzip \
  fail2ban \
  tmux \
  ccze \
  btop

install_awscli_v2

echo "[setup-prod] Ensuring user git and app directories..."
id git 2>/dev/null || useradd -m -s /bin/bash git
mkdir -p "$OUT_DIR"
chown -R git:git /home/git

# Placeholder so ALB / health checks can return 200 before the first release.
if [[ ! -f "${OUT_DIR}/index.html" ]]; then
  cat >"${OUT_DIR}/index.html" <<'EOF'
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>PortPax</title></head>
<body><p>PortPax</p></body>
</html>
EOF
  chown git:git "${OUT_DIR}/index.html"
fi

echo "[setup-prod] Removing default nginx site (if present)..."
rm -f /etc/nginx/sites-enabled/default

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

NGINX_SRC="${SCRIPT_DIR}/nginx/portpax.itmgroup.mx.conf"
if [[ -f "$NGINX_SRC" ]]; then
  install -m 0644 "$NGINX_SRC" /etc/nginx/sites-available/portpax.itmgroup.mx.conf
else
  echo "[setup-prod] WARN: ${NGINX_SRC} missing — writing minimal site."
  cat >/etc/nginx/sites-available/portpax.itmgroup.mx.conf <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name portpax.itmgroup.mx _;
    root ${OUT_DIR};
    index index.html;
    location / { try_files \$uri \$uri.html \$uri/ /index.html =404; }
}
EOF
fi
ln -sfn /etc/nginx/sites-available/portpax.itmgroup.mx.conf \
  /etc/nginx/sites-enabled/portpax.itmgroup.mx.conf

echo "[setup-prod] Creating nginx log files..."
"$SCRIPT_DIR/ensure_nginx_logs.sh"

nginx -t
systemctl enable nginx
systemctl restart nginx

systemctl enable fail2ban
systemctl restart fail2ban

if [[ -f "${SCRIPT_DIR}/systemd/tmux.service" && -f "${SCRIPT_DIR}/tmux_ops.sh" ]]; then
  echo "[setup-prod] Installing tmux.service (nginx logs + btop)..."
  mkdir -p "${APP_ROOT}/scripts/systemd"
  install -m 0755 "${SCRIPT_DIR}/tmux_ops.sh" "${APP_ROOT}/scripts/tmux_ops.sh"
  if [[ -f "${SCRIPT_DIR}/btop.conf" ]]; then
    install -m 0644 "${SCRIPT_DIR}/btop.conf" "${APP_ROOT}/scripts/btop.conf"
  fi
  chown -R git:git "${APP_ROOT}/scripts"
  # git needs read on nginx logs for the ops pane
  usermod -aG adm git 2>/dev/null || true
  install -m 0644 "${SCRIPT_DIR}/systemd/tmux.service" /etc/systemd/system/tmux.service
  systemctl daemon-reload
  systemctl enable --now tmux.service
else
  echo "[setup-prod] WARN: tmux_ops / systemd unit missing — skip ops dashboard."
fi


echo "[setup-prod] Done. Nginx serving ${OUT_DIR} on :80."
echo "[setup-prod] Ops: sudo -u git tmux attach -t portpax-fe-ops"
