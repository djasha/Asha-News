# Asha News Publish-Ready Plan (2026)

## Decision: Fix Forward, Do Not Rewrite
- Keep the existing repo and migrate in place.
- Reason:
  - Existing ingestion, clustering, and UI paths already work enough to harden.
  - A full rewrite would delay release and duplicate unresolved product decisions.
  - We can shrink and simplify while preserving momentum and real user feedback loops.

## Hosting Decision
- Keep `frontend on Netlify` + `backend/workers on VPS` for now.
- Supabase remains the single source for DB + Auth.
- Revisit full VPS hosting only after v1 reliability metrics are stable.

## Product Scope (v1)
- Home: personal feed + filters + clusters + optional market ticker.
- AI Checker: claim/article verification with evidence links.
- Markets: selected instruments (Gold, Silver, Oil, EUR/USD, BTC, ETH, major indices) with related news.
- Digest/API: personal digest, public digest, and agent-first structured endpoints.

## Simplified Architecture
- Frontend (React):
  - Route shells: `Home`, `AI Checker`, `Markets`, `Digest`.
  - Shared filter/query model reused across sections.
- API (Express):
  - Public read APIs.
  - Admin/ops APIs (strict auth in production).
  - Versioned agent APIs under `/api/v1`.
- Workers (VPS):
  - Ingestion, enrichment, clustering, digest generation.
  - Retry/idempotent jobs with queue semantics.
- Data (Supabase Postgres):
  - Canonical content tables + user preferences + digest snapshots.
  - RLS on user-scoped data.

## Security Baseline (Must-Have)
- Supabase Auth as canonical auth.
- Admin and operational routes locked in production.
- MCP execution route never public in production.
- Internal automation calls gated with `INTERNAL_API_KEY`.
- No admin/provider keys returned in API responses.

## Codebase Slim-Down Plan
1. Freeze legacy paths:
- Mark Directus-only routes/services as deprecated.
- Keep compatibility wrappers temporarily, but block new usage.
- Gate legacy route families with `LEGACY_DIRECTUS_ROUTES_ENABLED` and switch to `false` after client cutover.
- Default state should be `LEGACY_DIRECTUS_ROUTES_ENABLED=false` (opt-in only for temporary compatibility).

2. Archive dead assets:
- Move old backup/setup scripts to an archive boundary with clear labeling.
- Remove unused Netlify functions and old Directus bootstrap helpers.

3. Collapse route surface:
- Group routes by bounded context:
  - `feed`, `markets`, `digest`, `admin`, `ops`, `agent`.
- Remove duplicate aliases once clients migrate.

4. Normalize naming:
- Replace legacy `firebase_`/`directus` naming in active code paths with provider-neutral terms.

## Execution Phases
### Phase 1: Hardening (current)
- Complete auth migration to Supabase-compatible flow.
- Lock down admin/ops endpoints.
- Stabilize `/api/v1` digest + cluster + instrument endpoints.

### Phase 2: Product reshape
- Reduce top nav to core v1 surfaces only.
- Consolidate home sections into one configurable feed layout.
- Add instrument picker and related-news binding.

### Phase 3: Pipeline reliability
- Queue-based ingest + clustering workers on VPS.
- Source health scoring, dedupe guarantees, digest freshness SLA.

### Phase 4: Agent-first delivery
- Expand `/api/v1/openapi` and keep schemas stable.
- Add signed public digest tokens and revocation.
- Add MCP-compatible tool manifests on top of `/api/v1`.

## Publish-Ready Exit Criteria
- Security:
  - No unauthenticated admin/ops mutation routes in production.
- Reliability:
  - Ingestion and digest jobs recover automatically after transient failures.
- Product:
  - Home, AI Checker, Markets, Digest all usable end-to-end.
- Agent usability:
  - Public OpenAPI and stable machine-readable digest payloads.

## Release Gate Commands
- `npm run smoke:v1`
- `npm run smoke:security`
- `CI=true npm test -- --watch=false`
- `npm run build`
