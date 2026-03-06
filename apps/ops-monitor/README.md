# Asha Mission Control (`mc.asha.news`)

Standalone tactical Mission Control frontend built with React + Vite.

## Run

```bash
cd apps/ops-monitor
npm install
npm run dev
```

Optional backend override:

```bash
VITE_API_BASE=http://localhost:3001 npm run dev
```

Optional map style override (WM-compatible style URL):

```bash
VITE_MC_MAP_STYLE_URL="https://your-wm-style-endpoint/style.json" npm run dev
```

## Mission Control API Dependencies

1. `GET /api/mc/home`
2. `GET /api/mc/ticker`
3. `GET /api/mc/alerts/inbox`
4. `GET /api/mc/leaks`
5. `GET /api/mc/layers/catalog`
6. `GET /api/mc/explainers`
7. `PUT /api/mc/layouts/:id`
8. `GET /api/mc/notifications/preferences`
9. `PUT /api/mc/notifications/preferences`

## UX Defaults

1. Map-first shell with critical rail and breaking ticker.
2. Separate leaks lane with unverified warning semantics.
3. `Simple` mode by default for first-time users.
4. Contextual explainers via `?` icons for high-impact controls.
5. Mobile sheet pattern for `Critical`, `Ticker`, `Notifications`, and `Leaks`.
