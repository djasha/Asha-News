# WorldMonitor Hosting (Original Upstream Dashboard)

This project now launches the original `koala73/worldmonitor` dashboard for COD access.

## Upstream Sources

- App: https://www.worldmonitor.app
- Repo: https://github.com/koala73/worldmonitor
- Docs: https://github.com/koala73/worldmonitor/blob/main/docs/DOCUMENTATION.md

## Local Hosting Workflow

1. Bootstrap upstream clone + dependencies:

```bash
npm run worldmonitor:bootstrap
```

2. Run upstream dashboard locally (default full variant):

```bash
npm run worldmonitor:dev
```

3. Optional variant-specific local runs:

```bash
npm run worldmonitor:dev:tech
npm run worldmonitor:dev:finance
```

4. Run Asha News + API + WorldMonitor together:

```bash
npm run dev:full:worldmonitor
```

## VPS Install (Recommended)

Install upstream WorldMonitor on your VPS and run it with PM2:

```bash
bash scripts/vps-install-worldmonitor.sh srv840545.hstgr.cloud
```

Default VPS port is `4173` (change with `WM_PORT=...`).

After install, point Asha frontend launcher to VPS-hosted WorldMonitor:

```bash
REACT_APP_WORLDMONITOR_URL=http://<your-vps-ip>:4173
```

Then redeploy your frontend so COD links use the VPS URL.

## URL Wiring

- `COD - War Monitor` buttons and `/cod-war-monitor` launcher use `REACT_APP_WORLDMONITOR_URL`.
- Default is `https://worldmonitor.app`.
- For local upstream hosting, set:
  - `REACT_APP_WORLDMONITOR_URL=http://127.0.0.1:5173`

If you host upstream elsewhere, set this variable to your deployed URL.

## Notes

- The local upstream clone path `apps/worldmonitor-upstream/` is intentionally gitignored.
- Keep AGPL compliance obligations in mind when deploying modified upstream code.
