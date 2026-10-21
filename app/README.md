# AI Usage & Cost Tracker

The practice app used for every exercise. It records token usage of LLM calls per project and
model, prices them from a pricing table, and shows monthly totals, breakdowns and a budget
status. It runs fully offline: no API keys, no external services.

| Part | Stack | URL |
|---|---|---|
| `server/` | Node 22 + TypeScript, Express, SQLite (`node:sqlite`), Vitest | http://localhost:4000/api |
| `web/` | React + Vite | http://localhost:5173 |

## Quick start

Requirements: Node.js 22.13 or newer, pnpm 10. Run from the repo root:

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173.

## Commands

Run from the repo root.

| Command | What it does |
|---|---|
| `pnpm dev` | Run API and web together with reload |
| `pnpm test` | Server unit tests (Vitest) |
| `pnpm typecheck` | Type-check server and web |
| `pnpm build` | Build the web app |

## Configuration

Copy `server/.env.example` to `server/.env` to change the API port, database path, time zone or
monthly budget. All values have defaults.

## API

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/models` | Models with a known price |
| `GET /api/usage?month=YYYY-MM` | Records of a month with their cost and the month total |
| `POST /api/usage` | Add a usage record |
| `GET /api/summary?month=YYYY-MM` | Month total, breakdown by model and project, budget status |

## Layout

```
app/
├── server/
│   ├── data/pricing.json     # price per million tokens per model
│   ├── scripts/              # maintenance scripts
│   └── src/
│       ├── features/<name>/  # logic, routes, colocated *.test.ts
│       └── shared/           # database, time, money, errors
└── web/
    └── src/
        ├── features/<name>/  # React components
        └── shared/           # API client, formatting
```
