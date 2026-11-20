#!/usr/bin/env bash
#
# Install PortPax fail2ban nginx jail on the frontend host (PROD).
# Does NOT change the sshd jail port (AWS/SSM hosts stay on default ssh).
#
#   sudo ./scripts/fail2ban/install.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILTER_SRC="${SCRIPT_DIR}/filter.d/portpax-nginx.conf"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: run as root (sudo $0)" >&2
  exit 1
fi

echo "[fail2ban] Installing package (if needed)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq fail2ban

echo "[fail2ban] Installing filter + jail…"
install -d -m 0755 /etc/fail2ban/filter.d /etc/fail2ban/jail.d
install -m 0644 "$FILTER_SRC" /etc/fail2ban/filter.d/portpax-nginx.conf
install -m 0644 "$SCRIPT_DIR/jail.d/portpax-fe.local" /etc/fail2ban/jail.d/portpax-fe.local

if [[ ! -f /etc/fail2ban/jail.local ]]; then
  cat >/etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = auto
banaction = nftables-multiport
banaction_allports = nftables-allports
EOF
fi

echo "[fail2ban] Enabling service…"
systemctl enable fail2ban
systemctl restart fail2ban
sleep 1

echo "[fail2ban] Status:"
fail2ban-client status || true
echo
fail2ban-client status portpax-nginx || true
echo "[fail2ban] Done."
