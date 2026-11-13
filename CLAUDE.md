# claude-training

Practice repo for a 15-day Claude training program. The sandbox app is an AI Usage & Cost
Tracker: `app/server` (Express + `node:sqlite` API) and `app/web` (React + Vite dashboard).
Learning notes live in `docs/`. The remote is GitLab: use `glab` and merge requests, not `gh`.

## Commands

Use `pnpm` only.

- `pnpm dev`: API on http://localhost:4000 and web on http://localhost:5173
- `pnpm test`: server and web tests; one server file: `pnpm --filter server exec vitest run src/features/usage/cost.test.ts`; one web file: `pnpm --filter web exec vitest run <file>`
- `pnpm typecheck`: type-check server and web
- `pnpm seed`: replace the local database with the deterministic sample data

## Layout

- `app/server/src/features/<feature>/`: logic, routes and colocated `*.test.ts`
- `app/server/data/pricing.json`: price periods per model, USD per million tokens; a period with
  `from` (ISO 8601 UTC) applies from that instant
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
5. Commit messages follow Conventional Commits with the ticket id, e.g.
   `fix(usage): reject negative token counts with 400 (EXP-105)`. MR descriptions have What, Why,
   How tested and Notes for reviewer.

## Never

- Change a test's assertions or expected values to make it pass. Changing only a fixture's shape
  for a new type needs approval. If a test looks wrong against the ticket, stop and ask.
- Read or print `.env` files.
- Add a dependency without asking.
- Commit or push without being asked.
- Add AI attribution to commits or MRs: no `Co-Authored-By: Claude ...` trailer, no "Generated
  with Claude Code" line.

Code, comments, commits and docs in English. Chat with the user in Vietnamese.
