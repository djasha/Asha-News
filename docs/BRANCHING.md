# Branching Policy

This repository uses a simple branch model.

## Source of truth

- `main`
  - Always intended to be deployable
  - Tracks the current accepted state of the repo
  - Should stay readable and stable

## Reserved integration branches

- `mc/mission-control`
  - Reserved branch name for Mission Control
  - Normally kept aligned with `main`
  - Exists for clarity, handoff, and focused work visibility
- `wm/parity-integration`
  - Reserved branch name for World Monitor integration/parity work
  - Normally kept aligned with `main`
  - Exists for clarity around WM-backed work

These are not intended to drift far away from `main`.

- Prefer merging finished work into `main` first.
- If these reserved branches exist, fast-forward them to `main`.
- Do not use them as long-lived divergence branches unless there is a deliberate temporary reason.

## Working branches

Use short-lived branches for active work.

- `mc/<task>`
  - Mission Control UI, backend, alerts, mobile-readiness, and related work
- `wm/<task>`
  - World Monitor integrations, adapters, map parity, upstream resource ingestion
- `hotfix/<task>`
  - Urgent production fixes that should land quickly

Examples:

- `mc/feed-v2-polish`
- `mc/alerts-dispatch-hardening`
- `wm/map-layer-parity`
- `hotfix/mc-home-timeout`

## Rules

1. Start new work from the latest `main` unless the task is explicitly continuing an open branch.
2. Merge finished work back into `main`.
3. Delete short-lived work branches after merge.
4. Keep `mc/mission-control` and `wm/parity-integration` aligned with `main` unless there is a specific temporary integration reason.
5. Do not use `main` as a personal work branch.
6. Avoid branch names like `test`, `fixes`, `misc`, or timestamped WIP names for normal development.

## Historical branches

Some older `backup/*` or `archive/*` branches may remain for recovery purposes.

- Treat them as historical snapshots, not active integration branches.
- Do not base new work on them unless there is a specific recovery reason.

## Recommended flow

```bash
git switch main
git pull --ff-only origin main
git switch -c mc/my-task
```

When the work is ready:

```bash
git switch main
git pull --ff-only origin main
git merge --no-ff mc/my-task
git push origin main
git branch -d mc/my-task
git push origin --delete mc/my-task
```

If you want the reserved branches updated after a merge:

```bash
git branch -f mc/mission-control main
git branch -f wm/parity-integration main
git push origin main mc/mission-control wm/parity-integration
```
