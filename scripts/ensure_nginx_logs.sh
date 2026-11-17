#!/usr/bin/env bash
#
# Ensure nginx log files exist (run as root on the frontend host).
#
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: run as root (sudo $0)" >&2
  exit 1
fi

mkdir -p /var/log/nginx
touch /var/log/nginx/access.log /var/log/nginx/error.log

if getent group adm >/dev/null 2>&1; then
  chown www-data:adm /var/log/nginx/access.log /var/log/nginx/error.log
else
  chown www-data:www-data /var/log/nginx/access.log /var/log/nginx/error.log
fi
chmod 640 /var/log/nginx/access.log /var/log/nginx/error.log

echo "[ensure_nginx_logs] Ready: /var/log/nginx/access.log /var/log/nginx/error.log"
