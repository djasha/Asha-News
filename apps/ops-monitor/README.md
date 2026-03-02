# Ops Monitor App

Map-first monitor surface for `/monitor` parity.

## Run

```bash
cd apps/ops-monitor
npm install
npm run dev
```

Optional API override:

```bash
VITE_API_BASE=http://localhost:3001 npm run dev
```

## Endpoint Dependencies

1. `GET /api/monitor/layers`
2. `GET /api/monitor/news/digest`
3. `GET /api/monitor/signals/fusion`
4. `GET /api/monitor/freshness`
5. `GET /api/monitor/intel/brief`
