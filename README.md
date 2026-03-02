# Asha.News

AI-powered news aggregation platform that combats media bias by providing balanced, transparent news consumption from multiple perspectives.

## 🎯 Project Overview

Asha.News is similar to Ground News but enhanced with AI analysis to help users identify media bias, discover blindspots in coverage, and consume news from diverse perspectives.

## ✨ Features

### Core Features (MVP)
- **Home Feed** - Personal/public digest-aware feed with unified filters
- **AI Checker** - Claim and article verification workflows
- **Markets** - Instrument ticker, chart slot, and related instrument news
- **Digest/API** - Agent-friendly `/api/v1` endpoints with structured payloads
- **Conflict Monitor (Beta)** - Event-level counts/comparisons for locations, casualties, IDs released, systems used, and official announcements

### Design System
- **Responsive Design** - Mobile-first approach scaling to wide screens
- **Light/Dark Mode** - Seamless theme switching with user preference persistence
- **Bias Visualizations** - Interactive charts and indicators for bias analysis
- **Accessibility** - WCAG 2.1 AA compliant with keyboard navigation support

## 🛠 Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Router
- **Backend**: Node.js, Express, REST APIs
- **Database/Auth**: Supabase (Postgres + Auth)
- **AI**: Groq, OpenRouter, Perplexity, OpenAI (configurable providers)
- **Deployment**: Netlify (frontend), VPS (backend/workers)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project (URL + keys)

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/asha-news.git
cd asha-news
```

2. Install dependencies (applies to both frontend and backend workspaces):
```bash
npm install
```

3. Configure environment variables in `server/.env`:
```env
PORT=3001
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET=replace_with_a_long_random_secret
ADMIN_EMAIL=admin@asha.news
ADMIN_EMAILS=admin@asha.news
ADMIN_PASSWORD=replace_with_secure_admin_password
STRICT_AUTH=true
INTERNAL_API_KEY=replace_with_internal_service_key
MCP_PROXY_API_KEY=replace_with_mcp_proxy_key
LEGACY_DIRECTUS_ROUTES_ENABLED=false

# AI provider keys (optional but recommended)
GROQ_API_KEY=
OPENROUTER_API_KEY=
PERPLEXITY_API_KEY=
OPENAI_API_KEY=
```

4. Configure frontend env in `.env`:
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_V1_CORE_ONLY=true
REACT_APP_DOCS_ISSUE_URL=https://github.com/<org>/<repo>/issues/new
```

5. Start both servers:
```bash
npm run dev:full
```
This launches the backend (`http://localhost:3001`) and frontend (`http://localhost:3000`).

6. Verify the key routes:
- Frontend home: `http://localhost:3000/`
- Frontend AI checker: `http://localhost:3000/ai-checker`
- Frontend markets: `http://localhost:3000/markets`
- Frontend digest: `http://localhost:3000/digest`
- Frontend conflict monitor: `http://localhost:3000/conflicts`
- Admin settings: `http://localhost:3000/admin`
- Backend health: `http://localhost:3001/api/health`
- Agent OpenAPI: `http://localhost:3001/api/v1/openapi`
- Deprecations doc: `http://localhost:3001/API_DEPRECATIONS.md`

## 🧭 v1 Surface Policy

Primary navigation is intentionally slimmed to four surfaces:

1. Home
2. AI Checker
3. Markets
4. Digest

Legacy routes are disabled by default (`LEGACY_DIRECTUS_ROUTES_ENABLED=false`) and are not primary navigation surfaces.
Set `LEGACY_DIRECTUS_ROUTES_ENABLED=true` only for temporary compatibility while migrating remaining clients.

## 🧩 API Contracts

Primary agent contract is versioned under `/api/v1`:

- `GET /api/v1/openapi`
- `GET /api/v1/digest`
- `POST /api/v1/digest/share-token`
- `GET /api/v1/public/:userId`
- `GET /api/v1/public/token/:token`
- `GET /api/v1/clusters/search`
- `GET /api/v1/instruments/:symbol/news`
- `GET /api/v1/instruments/prices`

Deprecated compatibility routes are documented in [`API_DEPRECATIONS.md`](./API_DEPRECATIONS.md).

Conflict analytics routes (dashboard + ingestion):
- `GET /api/conflicts/openapi`
- `GET /api/conflicts/events`
- `GET /api/conflicts/stats`
- `GET /api/conflicts/related-news`
- `GET /api/conflicts/forecasts`
- `GET /api/conflicts/theories`
- `GET /api/conflicts/autonomy/status` (admin/internal key)
- `GET /api/conflicts/sources/candidates` (admin/internal key)
- `POST /api/conflicts/sources/candidates/:id/approve` (admin/internal key)
- `POST /api/conflicts/sources/candidates/:id/reject` (admin/internal key)
- `GET /api/conflicts/reviews/queue` (admin/internal key)
- `POST /api/conflicts/reviews/:eventId` (admin/internal key)
- `POST /api/conflicts/autonomy/run` (admin/internal key)
- `POST /api/conflicts/events` (admin/internal key required when strict auth enabled)
- `POST /api/conflicts/events/bulk` (admin/internal key required when strict auth enabled)
- `POST /api/conflicts/ingest/from-articles` (admin/internal key required when strict auth enabled)

Conflict Ops documentation package:
- Hub: [`docs/conflict-ops/README.md`](./docs/conflict-ops/README.md)
- AI agent contract: [`docs/conflict-ops/AI_AGENT_PLAYBOOK.md`](./docs/conflict-ops/AI_AGENT_PLAYBOOK.md)
- Developer guide: [`docs/conflict-ops/DEVELOPER_GUIDE.md`](./docs/conflict-ops/DEVELOPER_GUIDE.md)
- API reference: [`docs/conflict-ops/API_REFERENCE.md`](./docs/conflict-ops/API_REFERENCE.md)
- Data model: [`docs/conflict-ops/DATA_MODEL.md`](./docs/conflict-ops/DATA_MODEL.md)
- Runbook: [`docs/conflict-ops/OPERATIONS_RUNBOOK.md`](./docs/conflict-ops/OPERATIONS_RUNBOOK.md)
- Governance/safety: [`docs/conflict-ops/GOVERNANCE_AND_SAFETY.md`](./docs/conflict-ops/GOVERNANCE_AND_SAFETY.md)
- Public guide: [`docs/conflict-ops/PUBLIC_GUIDE.md`](./docs/conflict-ops/PUBLIC_GUIDE.md)
- Implementation status: [`docs/conflict-ops/IMPLEMENTATION_STATUS.md`](./docs/conflict-ops/IMPLEMENTATION_STATUS.md)
- In-app wiki index: `/wiki`
- In-app wiki page: `/wiki/conflict-ops`
- In-app AI Checker wiki: `/wiki/ai-checker`
- In-app Markets wiki: `/wiki/markets`
- In-app Agent API wiki: `/wiki/agent-api`

### Testing

Run the end-to-end content-hash caching suite:
```bash
node server/tests/content-hash-cache.test.js
```
The script exercises the Q&A, fact-check, and analysis endpoints to ensure cached responses are returned when cluster content is unchanged.

## 📱 Responsive Breakpoints

- **Mobile**: 320-767px (single column, hamburger menu)
- **Tablet**: 768-1023px (two-column layout)
- **Desktop**: 1024-1439px (three-column layout)
- **Wide**: 1440px+ (multi-column with sidebar)

## 🎨 Design System

### Color Palette
- **Light Mode**: Clean whites and slate grays for optimal readability
- **Dark Mode**: Deep slate backgrounds with high contrast text
- **Bias Colors**: Red (left), Green (center), Blue (right), Purple (mixed)

### Typography
- **Font**: Inter with system fallbacks
- **Responsive Scaling**: 24px → 36px headlines across breakpoints
- **Line Heights**: Optimized for readability (1.2-1.6)

## 📊 Bias Visualization Components

- **BiasBar**: Horizontal distribution bars showing left/center/right coverage
- **BiasIndicator**: Compact circular indicators with unique shapes
- **CoverageChart**: Donut charts for story coverage analysis
- **CredibilityMeter**: Star ratings for source credibility

## ⚙️ Admin Settings

### Clustering & Stories Configuration

The admin panel (`/admin/settings`) provides fine-grained control over story clustering and presentation:

#### Clustering Settings
- **Similarity Threshold** (0.0-1.0): Controls how similar articles need to be to cluster together
- **Max Cluster Size**: Maximum number of articles per cluster
- **Min Articles to Publish**: Minimum articles required to form a publishable cluster
- **Save to Database**: Whether to persist clusters to the backend datastore
- **Keep Individual Articles**: Enable/disable individual article links in clusters

#### Story Presentation
- **Show Bias Charts**: Toggle bias distribution visualizations
- **Show Perspectives**: Toggle source perspective indicators
- **Show Q&A**: Toggle AI-generated questions and answers
- **Show Key Facts**: Toggle extracted key facts section
- **Sources per Cluster**: Limit number of sources displayed
- **Summary Max Characters**: Truncate summaries to specified length

## 🔧 Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run server` - Runs the backend server
- `npm run dev:full` - Runs both frontend and backend concurrently
- `npm run smoke:v1` - Runs v1 API contract smoke checks against `BASE_URL`
- `npm run smoke:v1:auth` - Runs authenticated v1 digest/share-token smoke checks (requires `AUTH_TOKEN`)
- `npm run smoke:security` - Runs strict-mode security gate checks on an ephemeral backend
- `npm run soak:v1` - Runs long-duration v1 reliability checks (default 24h; configurable by env)
- `npm run release:check` - Runs publish candidate gate suite (lint, tests, build, security + v1 smoke checks, plus authenticated smoke by default). Set `AUTH_TOKEN` for the authenticated checks, or explicitly opt out with `REQUIRE_AUTH_SMOKE=false`.

Legacy Directus helper scripts are archived under `scripts/legacy-directus/` and are not part of the supported v1 workflow.

Release operations checklists:
- [`RELEASE_CHECKLIST_V1.md`](./RELEASE_CHECKLIST_V1.md)
- [`ROLLBACK_CHECKLIST_V1.md`](./ROLLBACK_CHECKLIST_V1.md)

## 📋 Development Roadmap

See [todo.md](./todo.md) for detailed development phases and task breakdown.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📞 Contact

For questions or support, please open an issue on GitHub.
