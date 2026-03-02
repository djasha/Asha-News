#!/usr/bin/env bash
set -euo pipefail

# Installs upstream worldmonitor on a remote VPS and runs it via PM2.
# Usage:
#   bash scripts/vps-install-worldmonitor.sh [ssh-host]
# Example:
#   bash scripts/vps-install-worldmonitor.sh srv840545.hstgr.cloud

SSH_HOST="${1:-srv840545.hstgr.cloud}"
REMOTE_DIR="${REMOTE_DIR:-/opt/worldmonitor-upstream}"
WM_PORT="${WM_PORT:-4173}"
BRANCH="${BRANCH:-main}"
SSH_BIN="${SSH_BIN:-ssh}"
SSH_OPTS="${SSH_OPTS:-}"

echo "Installing WorldMonitor on ${SSH_HOST}..."

# shellcheck disable=SC2086
${SSH_BIN} ${SSH_OPTS} "${SSH_HOST}" "bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

REMOTE_DIR="${REMOTE_DIR:-/opt/worldmonitor-upstream}"
WM_PORT="${WM_PORT:-4173}"
BRANCH="${BRANCH:-main}"

export DEBIAN_FRONTEND=noninteractive

if ! command -v git >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y git curl ca-certificates build-essential
fi

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

NODE_MAJOR="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if [ "${NODE_MAJOR}" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

mkdir -p "$(dirname "${REMOTE_DIR}")"
if [ ! -d "${REMOTE_DIR}/.git" ]; then
  git clone --depth=1 --branch "${BRANCH}" https://github.com/koala73/worldmonitor.git "${REMOTE_DIR}"
else
  git -C "${REMOTE_DIR}" fetch --depth=1 origin "${BRANCH}"
  git -C "${REMOTE_DIR}" checkout -f "${BRANCH}"
  git -C "${REMOTE_DIR}" reset --hard "origin/${BRANCH}"
fi

cd "${REMOTE_DIR}"
npm install
npm run build

npm install -g pm2 serve
pm2 delete worldmonitor >/dev/null 2>&1 || true
pm2 start "serve -s ${REMOTE_DIR}/dist -l tcp://0.0.0.0:${WM_PORT}" --name worldmonitor
pm2 save
pm2 startup systemd -u root --hp /root >/tmp/worldmonitor-pm2-startup.txt 2>&1 || true

IP_ADDR="$(hostname -I | awk '{print $1}')"
echo
echo "WorldMonitor is running on:"
echo "  http://${IP_ADDR}:${WM_PORT}"
echo
echo "PM2 status:"
pm2 status worldmonitor
REMOTE_SCRIPT

echo
echo "Done."
echo "Set REACT_APP_WORLDMONITOR_URL to your VPS URL (or reverse-proxied domain), then redeploy frontend."
