#!/usr/bin/env bash
#
# Deploy PortPax frontend to itm.portpax.com (shared server with rbcold).
# Requires: npm, rsync, SSH key for portpax-frontend (~/.ssh/config).
# Target: /home/git/itm/frontend/dist (nginx root for itm.portpax.com).
#

set -e

# Resolve script dir and frontend root (allow running from frontend/ or repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$FRONTEND_DIR/out"
REMOTE_HOST="portpax-frontend"
REMOTE_PATH="/home/git/itm/frontend/dist"

cd "$FRONTEND_DIR"

# Next.js embeds NEXT_PUBLIC_* at build time; .env.production must have NEXT_PUBLIC_API_URL=https://api.portpax.com
if [[ ! -f "$FRONTEND_DIR/.env.production" ]]; then
  echo "[deploy] WARNING: .env.production not found; build may use localhost as API URL" >&2
fi

echo "[deploy] Building (production)..."
NODE_ENV=production npm run build

if [[ ! -d "$OUT_DIR" ]]; then
  echo "[deploy] ERROR: Build did not produce $OUT_DIR (check next.config output: export)" >&2
  exit 1
fi

echo "[deploy] Creating remote directory (if needed)..."
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH && chown -R git:git /home/git/itm 2>/dev/null || true"

echo "[deploy] Syncing out/ -> $REMOTE_HOST:$REMOTE_PATH"
rsync -avz --delete -e ssh "$OUT_DIR/" "$REMOTE_HOST:$REMOTE_PATH/"

echo "[deploy] Fixing permissions for nginx (read + execute on dirs)..."
ssh "$REMOTE_HOST" "chmod -R a+rX $REMOTE_PATH"

echo "[deploy] Done. https://itm.portpax.com"
