# Test matrix: project budgets

- **From:** the acceptance criteria and rules of [EXP-112](../../tickets/EXP-112.md),
  [EXP-113](../../tickets/EXP-113.md) and [EXP-114](../../tickets/EXP-114.md), after zero-questions
  round 4. Not from the code.
- **Status:** drafted by Claude as QA, reviewed and approved by the QA owner on 2026-11-12 with no
  change.
- **Types:** happy, edge, negative, data (data variation). The app has no sign-in, so there are no
  permission variations; the one permission case is the accepted risk in row M-01.
- **Layer:** API cases run as server tests (Vitest, in-memory database). UI cases are browser checks
  until a web test runner is approved (spec concern 4).

## Plan

| Item | Value |
|---|---|
| Scope | The three tickets: API, banners, form |
| Environments | `pnpm dev`: API `http://localhost:4000`, web `http://localhost:5173`; time zone `Asia/Ho_Chi_Minh` |
| Data | Server tests insert chosen records. UI checks start from `pnpm seed` (`support-bot`, `code-review`, `docs-search`), then set budgets |
| Failure injection | UI cases that need a failed or slow API stub the request in the browser (Playwright MCP route or a stopped API) |
| Not tested | Load, concurrent edits by two people, browsers other than Chromium, time zones other than the configured one |
| Risks | Float arithmetic at boundaries, project names with special characters, page reloads that lose typed text |

## API: EXP-112

| ID | Criterion | Type | Given | Action | Expected |
|---|---|---|---|---|---|
| A-01 | sc 1 | happy | Records for the three projects | `GET /api/project-budgets` | 200; each project once; current `month` |
| A-02 | sc 1 | data | Records for `b`, `B`, `a`, `search, v2` | GET | Order `B`, `a`, `b`, `search, v2` (code points) |
| A-03 | sc 1 | data | A project with records only in a past month | GET | Listed, `spent` 0 |
| A-04 | rule | data | `code-review` has a budget; only unpriced records this month | GET | `spent` 0, `percent` 0, `ok` |
| A-05 | sc 1 | edge | No usage records at all | GET | 200, `projects` empty |
| A-06 | sc 2 | happy | `docs-search` no budget | GET | `budget`, `ratio`, `percent` null; level `none`; `spent` = cost this month |
| A-07 | sc 3 | edge | Budget 10.00; spent 0, 7.99, 8.00, 9.99, 10.00, 12.50 | GET | percent 0, 79, 80, 99, 100, 125; level ok, ok, warning, warning, exceeded, exceeded |
| A-08 | rule | edge | Budget 3.00, spent 2.40 | GET | `percent` 80, `warning` (cents, not float) |
| A-09 | rule | edge | Budget 10.00, spent 2.90 | GET | `percent` 29 |
| A-10 | rule | data | Spent equals the `byProject` cost for the month | GET and `GET /api/summary` | Same amount |
| A-11 | sc 4 | happy | No budget | `PUT …/code-review` `{"budgetUsd": 12.5}` | 200 with the entry, budget 12.5; GET shows it |
| A-12 | sc 5 | happy | Budget 10 | PUT 20 | GET shows 20 |
| A-13 | sc 6 | happy | Budget 10 | `DELETE …/code-review` | 204; level `none` |
| A-14 | sc 7 | edge | No budget | DELETE | 204 |
| A-15 | sc 8 | negative | — | PUT 0, -5, 1e-12 | 400 `budgetUsd must be greater than 0`; budget unchanged |
| A-16 | sc 8 | negative | — | PUT 10.005 | 400 `budgetUsd must have at most 2 decimals` |
| A-17 | sc 8 | negative | — | PUT 1000000.01 | 400 `budgetUsd must be at most 1000000` |
| A-18 | sc 8 | edge | — | PUT 1000000, PUT 0.01 | 200 both |
| A-19 | sc 8 | negative | — | PUT `"10"`, `null`, `true`, `[1]`, `{}`, missing field, body `[]`, no body, `1e999` | 400 `budgetUsd must be a number` |
| A-20 | rule | negative | — | PUT body `null`, `5`, invalid JSON | 500, unchanged from today |
| A-21 | rule | negative | — | PUT -5.005 | 400 `budgetUsd must be greater than 0` (order) |
| A-22 | rule | edge | — | PUT `{"budgetUsd": 5, "extra": 1}` | 200; extra ignored |
| A-23 | sc 9 | negative | No records for `new-team` | PUT 10 and DELETE | 404 `project not found` |
| A-24 | rule | negative | No records for `new-team` | PUT `{"budgetUsd": "x"}` | 404, not 400 |
| A-25 | rule | data | Project `search, v2` and `say "hi"` | PUT with percent-encoded name | 200 |
| A-26 | rule | data | Records for `code-review` only | PUT `Code-Review` | 404 (exact case) |
| A-27 | sc 10 | happy | Budget 10, database file in the temp folder | Reopen the app on the same file | Budget still 10 |
| A-28 | rule | happy | Budgets set | `pnpm seed` (or the seed function) | No budgets left |
| A-29 | rule | negative | Company budget at 90% | Set, change, remove project budgets | `GET /api/summary` unchanged; no log line, no webhook call |
| A-30 | rule | edge | — | PUT 10.000000000001 | 200; budget returned and stored as 10 |
| A-31 | rule | edge | Records this month and last month | `GET /api/project-budgets?month=2026-01` | Same answer as without `month` |

## Banners: EXP-113

| ID | Criterion | Type | Given | Action | Expected |
|---|---|---|---|---|---|
| B-01 | sc 1 | happy | Budget $10.00, spent $8.12 | Open dashboard | "Budget warning for code-review: $8.12 of $10.00 spent this month (81%)." in warning style |
| B-02 | sc 2 | happy | Spent $12.50 | Open | "Budget exceeded for code-review: … (125%)." in exceeded style |
| B-03 | sc 3 | negative | One project below 80%, one without budget | Open | No banner for either |
| B-04 | sc 4 | data | `a` 85%, `b` 130%, `c` 110% | Open | Order `b`, `c`, `a` |
| B-05 | rule | edge | Two projects at the same share | Open | Ordered by name, code points |
| B-06 | sc 5 | happy | Company 90%, `code-review` over | Open | Company banner first, unchanged; project banner below; unpriced banner after |
| B-07 | sc 6 | negative | `code-review` over | Pick a past month | No project banners, no load error line |
| B-08 | sc 7 | happy | Spent below 80% | Add a record that crosses 80% | Warning banner appears without a page reload |
| B-09 | sc 8 | negative | Budgets request fails | Open on current month | One line "Could not load project budgets: …"; no banners; rest of page loads |
| B-10 | rule | edge | Budgets request slow | Open | Banner area empty until the response |
| B-11 | rule | edge | Banners shown; budgets reload is slow | Save a budget (EXP-114) | Old banners stay until the response |
| B-15 | rule | edge | Banners shown | Add a record | Page shows "Loading…" as today; banners return when both loads finish |
| B-12 | rule | negative | Banners shown | Reload fails | Same as B-09 |
| B-13 | rule | negative | Summary request fails | Open | No banners and no budgets error line |
| B-14 | rule | data | API returns `percent` 81 for ratio 0.8199 | Open | Banner shows 81%, the API value |

## Form: EXP-114

| ID | Criterion | Type | Given | Action | Expected |
|---|---|---|---|---|---|
| F-01 | sc 1 | happy | Three projects, `code-review` budget 10 | Open | Section "Project budgets", rows in API order, field `10` with "$10.00" next to it; others empty with "No budget" |
| F-02 | sc 2 | happy | `docs-search` no budget | Type 15, Save | "Saved"; field `15`, "$15.00"; banners reload |
| F-03 | sc 3 | happy | Budget 10 | Type 7.5, Save | "Saved"; `7.5`, "$7.50" |
| F-04 | sc 4 | happy | Budget 10 | Remove | "No budget", empty field, no message; banners reload |
| F-05 | sc 5 | negative | No budget | Look at the row | No Remove button |
| F-06 | sc 6 | negative | — | Type 0, -5, 10.005, empty; Save | The API's error text alone; typed text kept; rest of page unchanged |
| F-07 | rule | negative | — | Type "abc"; Save | Sent as `null`; "budgetUsd must be a number" |
| F-08 | sc 7 | negative | API unreachable | Save | "Could not save: " plus error; typed text kept |
| F-09 | sc 9 | negative | API unreachable | Remove | "Could not remove: " plus error; budget still shown |
| F-10 | rule | negative | API answers 500 | Save | "Could not save: Internal server error" |
| F-11 | rule | negative | API answers 4xx without `error` | Save | "Request failed: 404" alone |
| F-12 | sc 8 | happy | Current month 2026-11 | Pick a past month | Section unchanged; "Spending shown for 2026-11." |
| F-13 | rule | edge | On the current month | Open | No "Spending shown for" sentence |
| F-14 | sc 10 | edge | No usage records | Open | "No projects have usage records yet." |
| F-15 | sc 11 | negative | Budgets request fails | Open | "Project budgets are unavailable." |
| F-16 | rule | edge | First load slow | Open | "Loading project budgets…" |
| F-17 | rule | edge | Typing in row B | Save row A | Row B keeps typed text and message; row A shows the API value (`15` after `15.0`) |
| F-18 | rule | edge | Request pending | Look at the row | Save and Remove disabled |
| F-19 | rule | edge | Budget 10 | Save 10 again | Request is sent; "Saved" |
| F-20 | rule | edge | Message shown | Edit the field | Message clears |
| F-21 | rule | happy | Typed text in a row | Add a usage record | Section stays; typed text kept |
| F-22 | rule | negative | — | Look for a new-name field | None; only projects with records |
| F-23 | rule | edge | Company budget, banners | Use the form | Company banner unchanged |
| F-24 | rule | edge | No usage records | Pick a past month | "No projects have usage records yet." and no "Spending shown for" |

## Accepted risks, not tested

| ID | Risk | Why |
|---|---|---|
| M-01 | Anyone who opens the dashboard can change a budget | The app has no sign-in; the client accepted it |
| M-02 | A malformed or `%2F` project name in the URL | Any 4xx or 5xx is accepted, so there is nothing to assert |
