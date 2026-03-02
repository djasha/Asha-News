#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$ROOT_DIR/apps/worldmonitor-upstream"
REPO_URL="https://github.com/koala73/worldmonitor.git"

if [ ! -d "$TARGET_DIR" ]; then
  echo "Cloning worldmonitor into $TARGET_DIR"
  git clone --depth=1 "$REPO_URL" "$TARGET_DIR"
fi

echo "Installing worldmonitor dependencies..."
npm --prefix "$TARGET_DIR" install

echo
echo "WorldMonitor bootstrap complete."
echo "Run with: npm run worldmonitor:dev"

