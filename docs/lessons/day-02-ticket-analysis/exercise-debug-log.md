# Day 02 exercise (afternoon): debug log for EXP-101

Method: [knowledge.md](knowledge.md#reproduce-and-debug), report template in
[knowledge.md](knowledge.md#reproduce-ready-template). Get the app running from scratch: clone the
repo into a new folder and follow [app/README.md](../../../app/README.md). Write the final repro
steps into the ticket, under "Repro" in [EXP-101](../../tickets/EXP-101.md); this log keeps the
hypotheses and evidence.

Conclude only from what you ran. Save screenshots and API responses in `evidence/` next to
this file (create it when needed).

## Hypotheses

| # | Hypothesis | Why I (or Claude) suspect it | How to verify | Result when run | Verdict |
|---|---|---|---|---|---|
| 1 | Rounding: the card and the table round costs differently | Differences are small (cents) | Compare request counts; rounding cannot change a count | Counts differ (346 vs 347 for 2026-09) | Ruled out |
| 2 | Pricing: the summary prices records differently (e.g. cached tokens) | Two endpoints compute cost separately | Group the table's per-record costs by month and compare with the summary | Same records give exactly the summary totals (24.58 / 346) | Ruled out |
| 3 | Month grouping: the two endpoints put records into different months | Count and cost differ in both directions, every month | Group all 890 records by their UTC month and compare with the summary; list table rows outside their UTC month | UTC grouping reproduces the summary exactly for all 3 months; the table for 2026-09 holds 3 rows from 2026-08-31 19:21-22:14 UTC, for 2026-10 2 rows from 2026-09-30 17:13-23:44 UTC | Confirmed |

## Layer

- Suspected layer: **code**
- Evidence:
  - Config is the default (`APP_TIMEZONE=Asia/Ho_Chi_Minh`, UTC+7) and is read correctly: the
    API logs `time zone Asia/Ho_Chi_Minh`.
  - Data is consistent: both endpoints read the same 890 records from `repository.listAll()`.
  - The month filters differ in code:
    - `/api/usage` uses `listMonth` (`usage.query.ts`): `toMonthKey(record.timestamp, timeZone)`,
      the month in the configured time zone.
    - `/api/summary` uses `summarizeMonth` (`summary.ts`): `record.timestamp.slice(0, 7)`, the
      month of the UTC timestamp, ignoring the time zone.
  - A record between 17:00 and 23:59 UTC on the last day of a month is already the next month in
    Ho Chi Minh City: the table counts it in the next month, the cards in the previous one.
  - Which one is right: the app is configured for a time zone, so the month must follow
    `APP_TIMEZONE`; the table is right and the cards (and budget percentage) are wrong.

## Failing test

- Branch: `fix/EXP-101`
- Test file and name: `app/server/src/features/summary/summary.routes.test.ts`
  - `counts a record in the month of the configured time zone (EXP-101)`
  - `matches the usage records total for the same month (EXP-101)`
- Setup: in-memory database, time zone `Asia/Ho_Chi_Minh`, one record at
  `2026-09-30T20:00:00.000Z` (1 October, 03:00 local) and one on 15 October.
- Failure output (assertion line):
  - `AssertionError: expected 1 to be 2` (October `recordCount`)
  - `AssertionError: expected 0.2 to be 0.4` (summary `totalCost` vs usage `totalCost`)
- `pnpm test`: 2 failed, 26 passed. `pnpm typecheck`: passes. Production code not changed.


## Git block

Method: [knowledge.md](knowledge.md#git-rebase-history-and-conflicts). No remote yet, so
`fix/EXP-101` tracks the local `main` (`git branch --set-upstream-to=main`) and `git pull` reads
from it.

- `git pull --rebase`: `fix/EXP-101` was 1 behind `main` (a README commit). Pull fetched
  `main` and replayed the test commit on top of it: history stays a straight line, no merge commit.
- `git log --oneline -- app/server/src/features/summary/summary.ts`: one commit, `3b02d5e`
  (`feat(server): add usage tracking API ...`). `git log -L` on the `timestamp.slice(0, 7)` line
  shows the line came in with that first commit: the bug has been there from the start.
- `git diff --stat main...fix/EXP-101`: the branch only adds `summary.routes.test.ts`; no
  production code changed yet.
- Merge conflict #1:
  - Seeded on purpose: `main` added `- **Status:** In progress` to `EXP-101.md`, the branch added
    `- **Branch:** fix/EXP-101` on the same line.
  - `git pull --rebase` stopped with a conflict in `docs/tickets/EXP-101.md`.
  - Resolved by keeping both lines (they don't contradict), removing the markers, then
    `git add` and `git rebase --continue`.
  - After the rebase: branch 2 ahead of `main`, 0 behind; `pnpm test` still 2 failed (the
    EXP-101 tests), 26 passed.
