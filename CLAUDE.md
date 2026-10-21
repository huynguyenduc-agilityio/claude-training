# claude-training

Practice repo for a 15-day Claude training program. The sandbox app is an AI Usage & Cost
Tracker: `app/server` (Express + `node:sqlite` API) and `app/web` (React + Vite dashboard).
Learning notes live in `docs/`.

## Commands

Use `pnpm` only.

- `pnpm dev`: API on http://localhost:4000 and web on http://localhost:5173
- `pnpm test`: server tests; one file: `pnpm --filter server exec vitest run src/features/usage/cost.test.ts`
- `pnpm typecheck`: type-check server and web
- `pnpm seed`: replace the local database with the deterministic sample data

## Layout

- `app/server/src/features/<feature>/`: logic, routes and colocated `*.test.ts`
- `app/server/src/shared/`: database, time, money, errors
- `app/server/data/pricing.json`: price per million tokens per model
- `app/web/src/features/<feature>/`: React components; `src/shared/` for API client and formatting
- `docs/tickets/`: backlog; `docs/plans/`: one plan per ticket; `docs/lessons/day-XX-<slug>/`: `knowledge.md` (all knowledge of the day) plus `exercise-*.md`
- `app/README.md`: app setup; root `README.md`: training plan from the course (fixed; no progress tracking)

## Ticket workflow

1. Read the ticket; list ambiguities and questions before coding.
2. Write a plan in `docs/plans/EXP-1XX-<slug>.md` and wait for approval:

   ```markdown
   # EXP-1XX: <title>
   ## Goal
   ## Steps
   ## Files to change
   ## How to verify
   ```
3. Write a failing test first, then the code to make it pass.
4. Run `pnpm test` and `pnpm typecheck` before reporting done.

## Rules

- Do not edit tests to make them pass. If a test looks wrong against the ticket, stop and ask.
- Do not read or print `.env` files.
- No new dependencies without asking.
- Commit only when asked. Never push.
- Code, comments, commits and docs in English. Chat with the user in Vietnamese.
