# Asha News v1 Release Checklist

This checklist is for the hybrid deployment target:
- Frontend: Netlify
- API/workers: VPS
- Auth/DB: Supabase

## 1) Pre-flight
- Confirm `STRICT_AUTH=true` in production env.
- Confirm `INTERNAL_API_KEY` is set in production env.
- Confirm `MCP_PROXY_API_KEY` is set in production env.
- Confirm `LEGACY_DIRECTUS_ROUTES_ENABLED=false` in production env.
- Confirm Supabase URL/keys are set for frontend and backend.

## 2) Local/Staging Release Gates
Run a full gate pass from repo root (authenticated smoke is required by default):

```bash
AUTH_TOKEN="<supabase_access_token>" npm run release:check
```

Only for local debugging, you can explicitly bypass authenticated smoke:

```bash
REQUIRE_AUTH_SMOKE=false npm run release:check
```

What this runs:
- backend lint + tests
- frontend tests + production build
- strict-mode security smoke
- v1 contract smoke
- authenticated digest/share-token smoke (`AUTH_TOKEN` required unless `REQUIRE_AUTH_SMOKE=false`)

## 3) Staging Smoke (Manual)
- Open `/`, `/ai-checker`, `/markets`, `/digest` on desktop and mobile widths.
- Validate Home filters affect feed sections.
- Validate Markets instrument switch updates chart slot/news.
- Validate Digest share token enable/rotate/disable flow.
- Validate admin pages are not accessible without admin auth.

## 4) Production Deploy
- Deploy backend/API and workers to VPS.
- Deploy frontend to Netlify.
- Verify production health:
  - `GET /api/health`
  - `GET /api/v1/openapi`
  - `GET /api/v1/digest?scope=public&limit=3`
- Verify strict auth in production:
  - admin/ops routes reject anonymous requests (401/403).
  - MCP routes require `X-API-Key` or admin auth.

## 5) 24h Reliability Gate
- Observe ingestion + clustering + digest jobs for 24h.
- Verify no unrecovered failures in logs.
- Verify `workers.heartbeat` in `/api/health` is updating.
- Run scripted soak check:

```bash
BASE_URL="https://<your-api-domain>" DURATION_HOURS=24 npm run soak:v1
```

## 6) Rollback Drill
- Run rollback once on staging before production publish.
- Use the checklist in `ROLLBACK_CHECKLIST_V1.md`.
