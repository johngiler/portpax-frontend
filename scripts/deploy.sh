#!/usr/bin/env bash
#
# Deploy PortPax frontend to itm.portpax.com (DEV / Testing).
# Requires: npm, rsync, SSH Host portpax-frontend (~/.ssh/config).
# Server repo path: /home/git/portpax — static export synced to /home/git/portpax/out
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$FRONTEND_DIR/out"
REMOTE_HOST="webapp"
REMOTE_REPO="/home/git/portpax"
REMOTE_PATH="$REMOTE_REPO/out"
ENV_FILE="$FRONTEND_DIR/.env.dev"

cd "$FRONTEND_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[deploy] ERROR: $ENV_FILE not found. Copy .env.dev.template to .env.dev" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

if [[ -z "${NEXT_PUBLIC_API_URL:-}" ]]; then
  echo "[deploy] ERROR: NEXT_PUBLIC_API_URL not set in .env.dev" >&2
  exit 1
fi

echo "[deploy] Building for DEV (NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL)..."
NODE_ENV=production npm run build

if [[ ! -d "$OUT_DIR" ]]; then
  echo "[deploy] ERROR: Build did not produce $OUT_DIR (check next.config output: export)" >&2
  exit 1
fi

echo "[deploy] Creating remote directory (if needed)..."
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH && chown -R git:git $REMOTE_REPO 2>/dev/null || true"

echo "[deploy] Syncing out/ -> $REMOTE_HOST:$REMOTE_PATH"
rsync -avz --delete -e ssh "$OUT_DIR/" "$REMOTE_HOST:$REMOTE_PATH/"

echo "[deploy] Fixing permissions for nginx (read + execute on dirs)..."
ssh "$REMOTE_HOST" "chmod -R a+rX $REMOTE_PATH"

echo "[deploy] Done. https://itm.portpax.com"
