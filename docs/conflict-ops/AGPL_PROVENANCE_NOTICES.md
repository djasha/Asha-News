# AGPL Provenance Notices

Last updated: 2026-03-02

This notice tracks provenance for conflict-ops modules that are derived, adapted, or reused from external sources.

## Scope

1. `/Users/Djasha/CascadeProjects/Asha News/server/services/conflictAnalyticsService.js`
2. `/Users/Djasha/CascadeProjects/Asha News/server/routes/conflictAnalytics.js`
3. `/Users/Djasha/CascadeProjects/Asha News/server/routes/monitorOps.js`
4. `/Users/Djasha/CascadeProjects/Asha News/src/pages/ConflictMonitorPage.js`
5. `/Users/Djasha/CascadeProjects/Asha News/apps/ops-monitor/*`

## Provenance Register

| Module | Source Class | License | Notice |
|---|---|---|---|
| conflict analytics service/routes | Original project implementation | MIT project license | No AGPL-derived code imported. |
| monitor ops routes + OpenAPI docs | Original project implementation | MIT project license | No AGPL-derived code imported. |
| tactical `/conflicts` page | Original project implementation | MIT project license | UI ideas inspired by common dashboard patterns, no code copy. |
| `apps/ops-monitor` Vite app scaffold | Original project implementation | MIT project license | Uses npm dependencies under their own licenses; no AGPL package dependency declared. |

## Operational Requirements

1. If AGPL-licensed code is imported, add module-level notice in this file before merge.
2. If AGPL network-use obligations apply, include source offer link in public `/monitor` and `/conflicts` footer.
3. Keep third-party dependency license inventories up to date in release artifacts.
