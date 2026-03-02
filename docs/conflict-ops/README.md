# Conflict Ops Documentation Hub

Last updated: 2026-03-02

This package is the canonical documentation set for the Autonomous Conflict Operations Dashboard (`/conflicts`) and its backend autonomy stack (`/api/conflicts`).

## Audience Map

1. AI agents: [AI Agent Playbook](./AI_AGENT_PLAYBOOK.md)
2. Human developers: [Developer Guide](./DEVELOPER_GUIDE.md)
3. Operators/SRE/admins: [Operations Runbook](./OPERATIONS_RUNBOOK.md)
4. API consumers: [API Reference](./API_REFERENCE.md)
5. Data engineers/analysts: [Data Model](./DATA_MODEL.md)
6. Governance/compliance: [Governance and Safety](./GOVERNANCE_AND_SAFETY.md)
7. Public/external users: [Public Guide](./PUBLIC_GUIDE.md)
8. Implementation tracking: [Implementation Status](./IMPLEMENTATION_STATUS.md)
9. AGPL provenance notices: [AGPL Provenance Notices](./AGPL_PROVENANCE_NOTICES.md)
10. Rollback and kill-switch matrix: [Rollback Matrix](./ROLLBACK_MATRIX.md)
11. Launch SLOs and regression budget: [SLO Gates and Regression Budget](./SLO_GATES_AND_REGRESSION_BUDGET.md)

## Scope

This documentation covers:

1. Tactical dashboard UX and behavior (including feature-flag fallback).
2. Conflict event ingestion, verification, and explainable aggregation.
3. Autonomous multi-agent workflows (scout, ingestion, verification, theory, forecast, reliability).
4. Guarded auto-fix boundaries, incident tracking, and auditability.
5. Theory and forecast publication gates and uncertainty requirements.

## Source of Truth Files

1. Routing/API: `/Users/Djasha/CascadeProjects/Asha News/server/routes/conflictAnalytics.js`
2. Service logic/agents: `/Users/Djasha/CascadeProjects/Asha News/server/services/conflictAnalyticsService.js`
3. Cron orchestration: `/Users/Djasha/CascadeProjects/Asha News/server/services/cronService.js`
4. DB schema: `/Users/Djasha/CascadeProjects/Asha News/server/db/schema.js`
5. DB migration: `/Users/Djasha/CascadeProjects/Asha News/server/db/migrate.js`
6. Tactical UI: `/Users/Djasha/CascadeProjects/Asha News/src/pages/ConflictMonitorPage.js`
7. Admin ops UI: `/Users/Djasha/CascadeProjects/Asha News/src/pages/admin/ConflictOpsPage.js`
8. Conflict OpenAPI: `/Users/Djasha/CascadeProjects/Asha News/server/openapi/conflict-ops-v1.json`
9. Monitor routes: `/Users/Djasha/CascadeProjects/Asha News/server/routes/monitorOps.js`
10. Monitor OpenAPI: `/Users/Djasha/CascadeProjects/Asha News/server/openapi/monitor-ops-v1.json`
11. Monitor app scaffold: `/Users/Djasha/CascadeProjects/Asha News/apps/ops-monitor`

## Execution Baseline

1. Database migration must run before enabling any conflict ops flags.
2. Autonomy defaults to shadow behavior until publish/quality gates pass.
3. Public dashboard remains functional when autonomy is disabled.
4. Identity exposure remains blocked unless verified and policy-approved.
