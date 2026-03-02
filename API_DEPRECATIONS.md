# API Deprecations (Legacy Compatibility Layer)

These routes are legacy compatibility paths while clients migrate to `/api/v1`.
By default, they are disabled unless `LEGACY_DIRECTUS_ROUTES_ENABLED=true`.

## Deprecated Endpoint Families

- `/api/cms/*`
- `/api/rss/ingest-from-directus` (use `/api/rss/ingest-from-content`)
- `/api/admin-settings/test-directus` (use `/api/admin-settings/test-db`)
- `/api/story-clusters/*` (use `/api/clusters/*` and `/api/v1/*` for read-focused agent workflows)
- Legacy Directus-named internals and payload naming (`firebase_uid`, `directus*`) where provider-neutral fields now exist.

## Migration Targets

- Digest and agent-read APIs: `/api/v1/*`
- User sync: `provider_uid`, `provider`, `email` in `/api/users`
- Market data/news: `/api/v1/instruments/*`

## Headers on Deprecated Calls

Requests to `/api/cms/*` return:

- `Deprecation: true`
- `Sunset: 2026-06-30`
- `Link: </API_DEPRECATIONS.md>; rel="deprecation"`

If `LEGACY_DIRECTUS_ROUTES_ENABLED=false`, `/api/cms/*` and `/api/flows/*` return `410 Gone`.

## Removal Policy

- No breaking removals in the current stabilization window.
- Removal starts only after replacement coverage and smoke tests are complete.
