#!/usr/bin/env bash
#
# PRODUCTION frontend host — pull a release from S3 into /home/git/frontend/out.
# Invoked by GitHub Actions via SSM SendCommand (or manually as root).
#
# Usage:
#   sudo ./scripts/deploy-prod-from-s3.sh s3://itm-portpax-prod-releases-040105284691/frontend/<sha>/
#
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: run as root (sudo $0 <s3-uri>)" >&2
  exit 1
fi

S3_URI="${1:-}"
if [[ -z "$S3_URI" ]]; then
  echo "Usage: $0 s3://bucket/frontend/<sha>/" >&2
  exit 2
fi

APP_ROOT="/home/git/frontend"
OUT_DIR="${APP_ROOT}/out"
TMP_DIR="$(mktemp -d /tmp/portpax-frontend-XXXXXX)"

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "[deploy-prod] Syncing ${S3_URI} → ${TMP_DIR}"
aws s3 sync "$S3_URI" "$TMP_DIR" --delete --region us-east-1

if [[ ! -f "${TMP_DIR}/index.html" ]]; then
  echo "ERROR: release missing index.html" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
echo "[deploy-prod] Publishing to ${OUT_DIR}"
rsync -a --delete "${TMP_DIR}/" "${OUT_DIR}/"
chown -R git:git "$APP_ROOT"
chmod -R a+rX "$OUT_DIR"

echo "[deploy-prod] Done."
