# Asha News Architecture Rethink (2026)

## Goals
- Ship a stable, useful product quickly.
- Keep it maintainable and AI-agent friendly.
- Consolidate news + social + markets into one coherent feed.
- Support personal, shared/public, and API-first digests.

## Product Surfaces (v1)
1. Home
- Personal feed (default), global feed toggle.
- Simple pinned sections (hero, top clusters, market strip, latest).
- Faceted filters: topic, source, bias, type, timeframe.

2. AI Checker
- Claim/article checker page.
- Evidence view + source links + confidence + model/provider metadata.

3. Markets
- Ticker strip (optional by user).
- Instrument page (chart + latest related news + social mentions).
- Initial instruments: Gold, Silver, Oil, EUR/USD, BTC, ETH, major indices.

4. Digest/API
- Private user digest endpoint.
- Public digest endpoint for shared feeds.
- Agent-focused summary endpoint with strict structured output.

## Architecture Principles
- Single canonical content model for all source types.
- Async ingestion and enrichment pipeline.
- Thin API read layer; heavy work in workers.
- Strict contracts: OpenAPI for HTTP, MCP tools for agents.
- Deterministic IDs and stable schemas for agent automation.

## Target Topology
- Frontend: Netlify (React app for now).
- API + workers: VPS (long-running jobs, queues, clustering, embeddings).
- Database/Auth/Search: Supabase (Postgres + Auth + RLS + pgvector/FTS).
- Optional realtime: Supabase Realtime for live ticker/alerts.

## Core Data Model
- `sources`: publisher/channel metadata and trust profile.
- `source_accounts`: specific handles/channels/feeds (YouTube channel, podcast feed, X handle, etc.).
- `content_items`: normalized content (article/post/video/episode/stream).
- `content_assets`: media and attachments.
- `content_links`: canonical/source URLs and dedupe fingerprints.
- `content_embeddings`: vectors + model metadata.
- `clusters`: story/topic clusters and timeline windows.
- `cluster_items`: junction table content↔cluster.
- `instruments`: symbols and aliases (`XAUUSD`, `EURUSD`, `BTCUSD`, etc.).
- `instrument_prices`: time-series OHLCV snapshots.
- `instrument_mentions`: content↔instrument junction.
- `user_profiles`: app profile fields.
- `user_preferences`: filter, source, and digest settings.
- `saved_views`: reusable user filter presets.
- `digests`: generated digest artifacts (user and public variants).
- `digest_items`: digest↔content relationship with rank.

## Ingestion Pipeline
1. Collect
- Pull adapters first: RSS/Atom, YouTube API, podcasts, Telegram bot feeds, market data provider.
- Social adapters with strict provider quotas/cost controls.

2. Normalize
- Map each raw payload into `content_items`.
- Compute canonical URL, source identity, timestamps, content hash.

3. Deduplicate
- URL dedupe + fuzzy title dedupe + semantic near-duplicate checks.

4. Enrich
- Language, entities, topics, bias/meta scoring, instrument extraction.
- Embeddings for semantic search + clustering.

5. Cluster
- Time-windowed clustering by topic/similarity.
- Cluster summaries and key points persisted for digest/API use.

6. Publish
- Feed ranking per user profile.
- Digest snapshots generated periodically and on-demand.

## Agent-Friendly Contract Layer
- OpenAPI 3.1 spec for all public/private HTTP endpoints.
- MCP server exposing high-value tools:
  - `get_latest_digest`
  - `search_news`
  - `get_cluster`
  - `get_instrument_news`
  - `get_public_feed`
- JSON Feed output for public digest portability.
- Stable versioned schemas (`/v1`, `/v2`) and cursor pagination.
- Strict structured summary endpoint for LLM context packing.

## Security and Access
- Supabase Auth as single auth source.
- Replace Firebase/custom JWT in app flow.
- RLS default-on for user-scoped tables.
- Service-role keys only in backend worker/API environment.
- Signed public feed tokens for shareable feeds with revocation support.

## Release Plan (Practical)
1. Foundation hardening
- Remove remaining legacy Directus naming paths.
- Complete Supabase Auth migration.
- Lock down all admin and user data routes.

2. Core product reshape
- Keep only Home, AI Checker, Markets, Digest.
- Remove/disable low-value sections until proven needed.
- Introduce unified filter component and shared query model.

3. Ingestion + digest reliability
- Queue-based ingestion workers on VPS.
- Digest generation jobs with retries + idempotency.
- Add quality checks and source health scoring.

4. Agent API
- Publish OpenAPI schema.
- Expose MCP server with read-first tooling.
- Add public JSON feed + signed user digest feed.

5. Scale and observability
- Metrics for ingestion latency, cluster quality, digest freshness.
- Per-source and per-provider cost monitoring.
- Alerting on failures and stale feeds.

## What Not To Do
- Do not keep multiple parallel auth systems.
- Do not split business logic across many ad-hoc route files without contracts.
- Do not run long ingest/cluster workloads in short-lived serverless jobs.
- Do not add new sections before core feed and digest reliability is stable.

