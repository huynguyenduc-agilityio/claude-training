# Regression report: project budgets (Day 14)

Run on 2026-11-16 by QA on `main` at `f5ce5fc` (EXP-112 to EXP-115 merged). Environment: `pnpm dev`,
API `http://localhost:4000`, web `http://localhost:5173`, built-in browser of the Claude desktop app,
time zone `Asia/Ho_Chi_Minh`. The database was reset with `pnpm seed` before and after the run.

**Result: no regression found.** Every check below passed. The only console errors were the two
`400` responses the run caused on purpose (rows 5 and 11).

## Automated suite

| Where | Result |
|---|---|
| Local `pnpm test` on `f5ce5fc` | Server 304 passed (18 files), web 94 passed (7 files) |
| Local `pnpm typecheck` | Server and web clean |
| GitHub Actions on `main` after the EXP-115 merge | [Run 43828484526](https://github.com/huynguyenduc-agilityio/claude-training/actions/runs/43828484526): green |
| GitHub Actions on the EXP-115 branch | [Run 43826740220](https://github.com/huynguyenduc-agilityio/claude-training/actions/runs/43826740220): green |

The suite covers every row of [test-matrix.md](test-matrix.md) (A-01 to A-31, B-01 to B-15, F-01 to
F-24) plus the five EXP-115 scenarios. The manual run below checks the features together, in a real
browser, against the real API.

## Manual run

| # | Area | Check | Result |
|---|---|---|---|
| 1 | Dashboard | Current month with no records: totals $0.00, "On track", empty tables, one row per project in "Project budgets", no console error | Pass |
| 2 | Month picker | September 2026: 347 requests, $24.84, "83%", "Over 80%", same as `GET /api/summary`; no project banner on a past month; "Spending shown for 2026-11." above the budget rows | Pass |
| 3 | CSV export | `GET /api/usage/export.csv?month=2026-10`: `200`, `text/csv`, file `usage-2026-10.csv`, 223 rows plus header | Pass |
| 4 | Add usage record (EXP-111) | `orion-mini`, `support-bot`, 24,000,000 input tokens: "Record added to 2026-11.", totals and tables reload, project row shows $24.00 spent | Pass |
| 5 | Company budget banner | At $24.00 of $30.00: "Budget warning: $24.00 of $30.00 spent this month (80%)." (exactly 80% warns) | Pass |
| 6 | Dot names (EXP-115) | Form with project `.`: "project must not be "." or ".."", record not added; API with `..`: `400` with the same text; `...` accepted (`201`) | Pass |
| 7 | Set budgets (EXP-114) | Save 20 for `support-bot`, 4 for `code-review`: each row shows "Saved" and the amount | Pass |
| 8 | Inherited names (EXP-115) | Save 10 for a project named `constructor`: "Saved" and "$10.00" | Pass |
| 9 | Banners (EXP-113) | Order: company banner, then "Budget exceeded for support-bot … (120%)", then "Budget warning for code-review … (87%)" | Pass |
| 10 | API order (EXP-115) | `GET /api/project-budgets` lists `...`, `code-review`, `constructor`, `docs-search`, `support-bot` | Pass |
| 11 | Validation | 10.005 for `constructor`: "budgetUsd must have at most 2 decimals"; other rows keep their "Saved" | Pass |
| 12 | Remove (EXP-114) | Remove on `code-review`: row shows "No budget", its banner goes, the others stay | Pass |
| 13 | Restart (R6) | After stopping and starting the API, `support-bot` 20 (`exceeded`) and `constructor` 10 (`ok`) are still there | Pass |

## Not covered

- Other browsers and mobile widths; only the desktop app's browser at 1024 px.
- A real network failure on Save or Remove; the automated tests stub it.
- The month-boundary edge between browser and server time zones (EXP-114 plan, question 4).
- Load: the run used at most 890 records.
