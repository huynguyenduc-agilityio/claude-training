# Spec: project budgets

- **From:** [brief.md](brief.md), [intake.md](intake.md) (client answers, rounds 1 and 2), and the
  decisions in [zero-questions.md](zero-questions.md)
- **Tickets:** [EXP-112](../../tickets/EXP-112.md), [EXP-113](../../tickets/EXP-113.md),
  [EXP-114](../../tickets/EXP-114.md)
- **Test matrix:** [test-matrix.md](test-matrix.md)
- **Status:** approved by the client on 2026-11-11, with the answers to the zero-questions rounds
- **Source of truth:** the repo. This file states the requirements; each ticket states the detailed
  rules for its part. If they disagree, stop and ask the BA: it is a bug in the pack. The
  [spec artifact](https://claude.ai/artifact/1JPZ9WjXMATw5CxXyD3izp) on claude.ai (private) shows the
  same content as this file.

## Problem

Several teams share one budget. At the end of the month the client sees only that the total went
over, not which team did. In the app, one team is one project.

## Requirements

API and storage (EXP-112):

- **R1.** Each project can have one budget: a USD amount of at least one cent, at most 1000000, with
  at most two decimals.
- **R2.** A budget applies to the current month until it is changed or removed. There is no history.
- **R3.** A budget can be set, changed and removed. A removed budget leaves the project with no budget.
- **R4.** Only a project that has at least one usage record can have a budget.
- **R5.** For each project with usage records, the API reports this month's spending, the budget, the
  share spent and a level: `none` without a budget, `ok` below 80%, `warning` from 80%, `exceeded`
  from 100%.
- **R6.** Budgets are kept in the app's database and survive a restart. `pnpm seed` leaves none.
- **R7.** The company-wide budget, `GET /api/summary`, its banner and its alert do not change.

Banners (EXP-113):

- **R8.** For the current month, the dashboard shows one banner per project at `warning` or
  `exceeded`, below the company-wide banner.
- **R9.** A banner stays while the level lasts and cannot be dismissed. Nothing is sent outside the
  dashboard.
- **R10.** The banners reload when a usage record is added and when a budget changes.

Form (EXP-114):

- **R11.** A "Project budgets" section lists every project with usage records, its spending this month
  and its budget.
- **R12.** Each row can set, change and, when a budget is set, remove the budget.
- **R13.** The API is the only place that decides what is valid. The form shows the API's error text
  and keeps what was typed.
- **R14.** No new project names can be typed.

## Design

### API

`GET /api/project-budgets`, current month only:

```json
{
  "month": "2026-11",
  "projects": [
    { "project": "code-review", "budget": 10, "spent": 8.12, "ratio": 0.812, "percent": 81, "level": "warning" },
    { "project": "docs-search", "budget": null, "spent": 1.2, "ratio": null, "percent": null, "level": "none" }
  ]
}
```

- `projects` is sorted by project name in code-point order and holds every project that has a
  usage record in any month.
- `spent` is computed as `byProject` in `summarizeMonth`: priced records only, rounded to cents.
- `percent` and `level` are computed in whole cents, at the same thresholds as `budgetStatus`
  (80% and 100%). `ratio` is `spent / budget` for information only. A project without a budget is
  handled separately, since `budgetStatus` needs one. The page never computes `percent` or `level`;
  it only orders banners by comparing shares in whole cents from `spent` and `budget` (EXP-113).
  EXP-112 gives the formulas.

`PUT /api/project-budgets/:project` with `{"budgetUsd": number}`:

- `200` with the project's entry, as in the list above.
- `400` with `{"error": "..."}`: `budgetUsd must be a number`, `budgetUsd must be greater than 0`,
  `budgetUsd must have at most 2 decimals`, `budgetUsd must be at most 1000000`.
- `404` with `{"error": "project not found"}` when the project has no usage records. The project is
  checked before the body, and the body checks run in the order EXP-112 lists. Other fields in the
  body are ignored. A body that is not valid JSON answers 500, as on every endpoint today.

`DELETE /api/project-budgets/:project`:

- `204`, also when no budget was set. `404` with `project not found` for an unknown project.

`:project` is percent-encoded and matched exactly, including case.

### Storage

A new table in the existing SQLite database, one row per project with a budget. The table name and
columns are the developer's choice in the EXP-112 plan. `pnpm seed` empties it.

### Dashboard

- Banners: the same styles as today's `BudgetBanner`, right below it and above the unpriced banner.
  Text: `Budget warning for <project>: <spent> of <budget> spent this month (<percent>%).` and the
  same with `Budget exceeded`. Order: exceeded first, then the higher share compared in whole
  cents, then project name.
- Form: a "Project budgets" section below the Add record form and above the banners and totals. It
  stays on the page while the month's data reloads. One row per project with a number field, the
  amount in money format next to it, Save and, when a budget is set, Remove.
- Reloads: adding a usage record reloads the month's data and the project budgets. Saving or
  removing a budget reloads only `GET /api/project-budgets`. The budgets are fetched on their own,
  outside the month's `Promise.all`, so their failure does not stop the rest of the page.

## How each answer is met

| Client answer | Met by |
|---|---|
| 1. One team is one project | Budgets keyed by the record's `project` (R1, R4) |
| 2. Set on the dashboard | EXP-114 (R11, R12) |
| 3. Fixed monthly amount | R2 |
| 4. No budget, no warning | Level `none`, no banner (R5, R8) |
| 5. Keep the company-wide budget | R7 |
| 6. 80% and 100% | R5 |
| 7. Dashboard only, client only | R9 |
| 8. Inform only | Usage API unchanged (R7, non-scope) |
| 9. Current month only | `GET /api/project-budgets` ignores any month parameter; banners hidden on past months (R8) |
| 10 and 12. Show while it lasts | R9 |
| 11. One banner per project at the top | R8 |
| 13. Removable | R3, R12 |
| 14. Above 0 | R1 |
| 15. Only projects with records | R4, R14 |

## Parallel work on Day 13

| Stream | Tickets | Files |
|---|---|---|
| Server | EXP-112 | `app/server/src/features/budget/`, `app/server/src/shared/db.ts`, `app/server/src/app.ts`, `app/server/scripts/seed.ts` |
| Web | EXP-113, then EXP-114 | `app/web/src/features/`, `app/web/src/shared/api.ts`, `app/web/src/App.tsx` |

The two streams share no file. EXP-113 and EXP-114 both change `App.tsx`, so they run one after the
other in the same session.

## Areas of concern

1. **Anyone can change a budget.** The app has no sign-in. The client accepted this for now.
   Owner: client.
2. **A project renamed in the records loses its budget.** Names are free text and matched exactly.
   `Code-Review` and `code-review` are two projects. Owner: client, if it happens.
3. **Unpriced records are not counted.** A project whose records have no price looks under budget.
   This matches the company-wide total today. Owner: client.
4. **No automated check for the web part.** `app/web` has no test runner. Adding Playwright is a new
   dependency and needs approval before Day 13. Owner: lead.
5. **BA proposals:** banner wording and order, the form's position and texts, at most two decimals,
   the largest amount. The client approved them on 2026-11-11 with the answers to the
   zero-questions rounds in [zero-questions.md](zero-questions.md). Owner: client.
