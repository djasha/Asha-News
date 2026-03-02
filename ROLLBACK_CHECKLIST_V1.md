# Asha News v1 Rollback Checklist

Use this when a production deploy is unhealthy or fails publish gates.

## Trigger Conditions
- Repeated 5xx from `/api/v1` routes.
- Auth bypass risk or security smoke failure in production.
- Ingestion/digest workers failing without recovery.
- Severe frontend regression on core 4 surfaces.

## Rollback Steps
1. Freeze deploy pipeline
- Stop new deploys for frontend and backend.

2. Roll back backend/workers on VPS
- Switch API process to the previous known-good release.
- Restart API and workers (PM2/systemd according to your VPS setup).
- Verify:
  - `GET /api/health`
  - `GET /api/v1/openapi`

3. Roll back Netlify frontend
- Promote previous successful deploy in Netlify.
- Verify `/`, `/ai-checker`, `/markets`, `/digest`.

4. Confirm security posture after rollback
- `STRICT_AUTH=true` still active.
- `INTERNAL_API_KEY` and `MCP_PROXY_API_KEY` still present.
- Run:

```bash
npm run smoke:security
```

5. Confirm v1 contract availability

```bash
npm run smoke:v1
```

6. Incident capture
- Record failing release version, timestamps, root symptom, and rollback commit/deploy IDs.
- Open follow-up issue before re-attempting release.

## Re-entry Criteria
- Release-candidate checks pass:

```bash
npm run release:check
```

- Root cause identified and patched.
- Staging smoke passes on the patched candidate.
