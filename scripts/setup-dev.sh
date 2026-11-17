#!/usr/bin/env bash
#
# One-time DEV frontend host setup (BCT, itm.portpax.com). Run as root on Ubuntu.
# Serves Next.js static export; TLS via Certbot on this host.
#
# After this script:
#   1. Ensure /home/git/portpax exists (deploy.sh syncs out/)
#   2. Copy scripts/nginx/itm.portpax.com.conf to sites-available and enable it
#   3. certbot --nginx -d itm.portpax.com
#   4. nginx -t && systemctl reload nginx
#
# Subsequent updates: ./scripts/deploy.sh from your machine.
# PRODUCTION bootstrap: ./scripts/setup-prod.sh
#

set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: run as root (sudo $0)" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[setup-dev] Updating apt..."
apt-get update -qq

echo "[setup-dev] Installing system packages..."
apt-get install -y \
  nginx \
  certbot python3-certbot-nginx \
  git \
  rsync \
  fail2ban \
  tmux \
  ccze \
  btop

echo "[setup-dev] Ensuring user git and app directories..."
id git 2>/dev/null || useradd -m -s /bin/bash git
mkdir -p /home/git/portpax/out
chown -R git:git /home/git

echo "[setup-dev] ACME webroot for Let's Encrypt..."
mkdir -p /var/www/letsencrypt
chown -R www-data:www-data /var/www/letsencrypt

echo "[setup-dev] Removing default nginx site (if present)..."
rm -f /etc/nginx/sites-enabled/default

echo "[setup-dev] Creating nginx log files..."
"$SCRIPT_DIR/ensure_nginx_logs.sh"

NGINX_SRC="${SCRIPT_DIR}/nginx/itm.portpax.com.conf"
if [[ -f "$NGINX_SRC" ]]; then
  install -m 0644 "$NGINX_SRC" /etc/nginx/sites-available/itm.portpax.com.conf
  ln -sfn /etc/nginx/sites-available/itm.portpax.com.conf \
    /etc/nginx/sites-enabled/itm.portpax.com.conf
  nginx -t
  systemctl enable nginx
  systemctl reload nginx || systemctl restart nginx
else
  echo "[setup-dev] WARN: ${NGINX_SRC} missing — install nginx site manually."
fi

systemctl enable fail2ban
systemctl restart fail2ban

echo "[setup-dev] Done. See header comments for Certbot and deploy.sh."
