#!/usr/bin/env bash
set -euo pipefail

REMOTE="${REMOTE:-origin}"
BASE_BRANCH="${1:-main}"
TARGET_BRANCHES=(
  "mc/mission-control"
  "wm/parity-integration"
)

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Not inside a git repository." >&2
  exit 1
fi

if ! git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
  echo "Base branch '$BASE_BRANCH' does not exist locally." >&2
  exit 1
fi

BASE_SHA="$(git rev-parse "$BASE_BRANCH")"

echo "Syncing reserved branches to $BASE_BRANCH ($BASE_SHA)"

for branch in "${TARGET_BRANCHES[@]}"; do
  git update-ref "refs/heads/$branch" "$BASE_SHA"
done

git push --force-with-lease "$REMOTE" \
  "$BASE_BRANCH" \
  "refs/heads/mc/mission-control:refs/heads/mc/mission-control" \
  "refs/heads/wm/parity-integration:refs/heads/wm/parity-integration"

echo "Reserved branches now match $BASE_BRANCH."
