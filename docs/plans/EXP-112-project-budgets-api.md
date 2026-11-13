# EXP-112: Store project budgets and report each project's budget status

## Goal

Add one monthly USD budget per project, kept in the app's SQLite database, and an API
(`GET /api/project-budgets`, `PUT` and `DELETE /api/project-budgets/:project`) that lists every
project with this month's spending, budget, share spent and level. Spec requirements R1 to R7.
The company-wide budget, `GET /api/summary`, its banner and its alert do not change.

## Decisions (MINOR questions from zero-questions round 4 and 5, plus one found in planning)

| Question | Decision |
|---|---|
| Round 4 #13: optional dependency in `createApp` | `projectBudgets?: ProjectBudgetRepository` in `Deps`. When absent, `createApp` builds one on a private `:memory:` database, so the routes always exist and the existing tests call `createApp` unchanged. `index.ts` passes the real repository. |
| Round 5 #5: `ratio` from dollars or cents | `spent / budget` in dollars (both already rounded to cents), not rounded. For information only. |
| Round 5 #8: "at most 1000000" raw or rounded | Raw: `budgetUsd > 1000000` fails. Checked third, as the ticket orders it. |
| Round 4 seed test | Automated: a test runs `scripts/seed.ts` as a child process with `DB_PATH` in a temp folder and checks that the budgets table is empty. |
| Storage | Table `project_budgets(project TEXT PRIMARY KEY, budget_cents INTEGER NOT NULL)`. Integer cents, so no float is stored. Budget returned as `budget_cents / 100`. |
| Existence of a project (R4) | A project exists when some usage record has that `project`, matched exactly (case-sensitive). Taken from `repository.listAll()`, as the summary does. No change to `UsageRepository`. |
| **New, asked and answered by the user:** "at most 2 decimals" tolerance | The ticket's fixed `1e-9` rejects valid amounts above about $131,072 (e.g. 131072.02) because `budgetUsd × 100` carries float error larger than 1e-9 there. Checked in Node. Decision: tolerance is `max(1e-9, 4 × Number.EPSILON × \|budgetUsd × 100\|)`. Verified for every cent amount from 0.01 to 1000000.00 (0 wrongly rejected); 10.005, 999999.995 and 0.005 still rejected; 10.000000000001 still accepted and stored as 10. After approval, update the rule in `EXP-112.md` (and the matching sentence in the "More rules" list); R1 and the API contract in `spec.md` already say "at most two decimals" and need no change. |

No other question changes what a user or caller sees.

## Steps

1. `pnpm install` in the worktree (no new dependency).
2. Write failing tests first and show them failing (`pnpm --filter server test`), in this order:
   status function, validation, repository, routes, seed.
3. Code to make them pass:
   - `project-budget.status.ts` (pure): `projectBudgetStatus(spent, budget | null)` in whole cents.
     `s = round(spent × 100)`, `b = round(budget × 100)`. `percent = floor(100 s / b)` computed with
     integer arithmetic, `warning` when `100 s ≥ 80 b`, `exceeded` when `s ≥ b`, else `ok`. No budget:
     `budget`, `ratio`, `percent` null and level `none`.
     `listProjectBudgets(records, budgets, month, timeZone, pricing)`: projects with any record, sorted by
     code point (`a < b ? -1 : 1`, not `localeCompare`), `spent` from `summarizeMonth(...).byProject`
     (0 when absent).
   - `project-budget.validation.ts`: `parseBudgetUsd(body)` in the ticket's order (finite number;
     `Math.round(x × 100) ≥ 1`; `x ≤ 1000000`; at most 2 decimals with the scaled tolerance), throws
     `ValidationError`. Returns the whole cents.
   - `project-budget.repository.ts`: `get`, `list` (all budgets as a map), `set(project, cents)`
     (upsert), `remove(project)`, `clear()`.
   - `project-budget.routes.ts`: router for `/api/project-budgets`. GET ignores the query. `PUT/DELETE
     /:project`: project checked first (404 `project not found`), then the body (400). PUT answers 200 with
     the entry; DELETE answers 204 also when nothing was set.
   - `shared/db.ts`: add the `project_budgets` table to `SCHEMA` (`CREATE TABLE IF NOT EXISTS`).
   - `app.ts`: optional dependency, mount the router. `index.ts`: pass the repository.
   - `scripts/seed.ts`: clear the budgets next to the usage records.
4. Mark the EXP-112 row `Done` in `docs/tickets/README.md`; update the decimals rule in `EXP-112.md`.
5. `pnpm test` and `pnpm typecheck`.
6. Stop and ask the user to run `/ship-ticket EXP-112`. Only then: commit, push, open the MR, merge
   when GitLab says mergeable and checks pass.

## Files to change

New, in `app/server/src/features/budget/`:
`project-budget.status.ts`, `project-budget.validation.ts`, `project-budget.repository.ts`,
`project-budget.routes.ts`, and colocated `*.test.ts` for each (the routes test also covers the
restart and seed cases).

Changed: `app/server/src/shared/db.ts`, `app/server/src/app.ts`, `app/server/src/index.ts`,
`app/server/scripts/seed.ts`, `docs/tickets/EXP-112.md` (decimals rule), `docs/tickets/README.md`
(row `Done`), `docs/plans/EXP-112-project-budgets-api.md` (this plan). No existing test is changed.
`spec.md`: no change expected (R1 and the contract already say "at most two decimals").

## Test-matrix rows that become automated tests

All 31 rows, A-01 to A-31. None is manual.

| Rows | Where | Notes |
|---|---|---|
| A-04, A-07, A-08, A-09 | status test | Direct calls with chosen cents, so 7.99, 2.40 of 3.00 and 2.90 of 10.00 are exact. A-07 also runs through the route with chosen records that cost exactly those amounts (1M input tokens = $1 on `orion-mini`). |
| A-15, A-16, A-17, A-18, A-19, A-21, A-22, A-30 | validation test, plus a few through the route | Includes the new rows below. |
| A-01, A-02, A-03, A-05, A-06, A-10, A-11 to A-14, A-23 to A-26, A-31 | routes test, real `createApp` over `:memory:` | A-10 compares with `GET /api/summary` `byProject`. A-25 uses `encodeURIComponent`. |
| A-20 | routes test | Raw strings `null`, `5`, `{bad` with `content-type: application/json` answer 500. `console.error` is mocked to keep output clean. |
| A-27 | routes test | Database file in `os.tmpdir()`, two `createApp` instances on two connections to the same file, file deleted in `afterAll`. Never `data/usage.db`. |
| A-28 | seed test | Child process `node --import tsx scripts/seed.ts` with `DB_PATH` in a temp folder, then reads the table. If the spawn proves flaky on Windows, fall back to testing the repository `clear()` and report it. |
| A-29 | routes test | `notifyBudget` spy and `console.log` spy not called; `GET /api/summary` identical before and after set, change and remove, with the company budget at 90%. |

Extra tests, not in the matrix (QA can add rows if wanted): PUT 131072.02, 999999.99 and 1000000
give 200 (the decimals fix); PUT 0.005 gives 400 at most 2 decimals; PUT 999999.995 gives 400; the
list is empty of budgets for a fresh database (R6); two projects `b` and `B` keep separate budgets.

## How to verify

- Failing tests shown before the code, then green: `pnpm test` (expect about 35 new tests) and
  `pnpm typecheck` both pass.
- One-off manual check with a throw-away DB: `DB_PATH=<temp> pnpm seed`, start the API on a spare
  port against it, call the three endpoints. Not needed for the checks above and skipped if the other
  session holds ports 4000 and 5173.
- Not verified: behavior of the real browser dashboard (EXP-113, EXP-114).
