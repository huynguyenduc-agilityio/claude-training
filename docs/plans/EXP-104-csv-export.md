# EXP-104: Export a month of usage records to CSV

## Goal

The dashboard gets an "Export CSV" button that downloads the selected month's usage records as
`usage-YYYY-MM.csv`: a header row plus one row per record shown in the table, in the same order,
with the cost column summing to the total under the table. The button is disabled when the month
has no records.

Decisions (answered by the reporter in planning):

- **Built on the server** from `listMonth` (`app/server/src/features/usage/usage.query.ts:25`), the
  same function that feeds the table and its total, so rows and total cannot drift apart. The web
  app has no test runner; the server logic is covered by vitest.
- **Header:** `Time,Project,Model,Input tokens,Cached input tokens,Output tokens,Cost (USD)`.
- **Time:** ISO 8601 in the configured time zone with its offset, e.g.
  `2026-10-01T01:00:00+07:00` for a record stored as `2026-09-30T18:00:00Z`. This matches the month
  the row is listed under.
- **Cost:** plain number, 8 decimals, no `$` (e.g. `0.00423000`). Prices are at most 2 decimals per
  million tokens, so 8 decimals keep each row exact and the column sum rounds to `totalCost`.
- **Tokens:** plain integers, no thousands separators. Null `cachedInputTokens` is an empty cell.
- **Format:** UTF-8 with BOM (Excel opens it correctly), comma separator, CRLF line endings
  (RFC 4180). Fields with `,`, `"`, CR or LF are quoted, `"` doubled.
- **CSV injection:** a text field starting with `=`, `+`, `-`, `@`, tab or CR gets a leading `'`
  (applies to project and model; numbers are written by us).
- **Endpoint:** `GET /api/usage/export.csv?month=YYYY-MM`, `Content-Type: text/csv; charset=utf-8`,
  `Content-Disposition: attachment; filename="usage-YYYY-MM.csv"`. Month is read with the existing
  `readMonth` (`usage.routes.ts:16`): missing means current month, invalid gives `400`. An empty
  month still returns the header row (the UI disables the button anyway).

Out of scope: other date ranges or filters, export of the summary tables.

## Steps

1. **Time helper (test first).** In `app/server/src/shared/time.test.ts` add failing tests for
   `toZonedIsoString(timestamp, timeZone)`: `2026-09-30T18:00:00Z` in `Asia/Ho_Chi_Minh` gives
   `2026-10-01T01:00:00+07:00`; in `UTC` gives `2026-09-30T18:00:00+00:00`. Then implement it in
   `shared/time.ts` with `Intl.DateTimeFormat` (`hourCycle: 'h23'`, `timeZoneName: 'longOffset'`),
   next to `toMonthKey`.
2. **CSV builder (test first).** New `app/server/src/features/usage/usage.csv.test.ts` for
   `toUsageCsv(usage: MonthlyUsage, timeZone: string): string`:
   - starts with the BOM and the header row; rows end with CRLF;
   - one row per item, same order as `items` (newest first);
   - a row's values: zoned time, project, model, tokens, cost with 8 decimals;
   - null cached tokens give an empty cell;
   - a project with a comma or quote is quoted; a project starting with `=` gets a leading `'`;
   - the sum of the cost column, rounded to cents, equals `totalCost` for a month built with
     `listMonth` from many records (cent-drift check);
   - an empty month gives only the BOM and header.
   Then implement `usage.csv.ts` (pure function, no Express).
3. **Route (test first).** In `usage.routes.test.ts` add a `GET /api/usage/export.csv` describe,
   reusing the in-memory server setup already in that file: seeds records via
   `repository.insert`, expects `200`, the `Content-Type` and `Content-Disposition` headers, and
   a body equal to `toUsageCsv(listMonth(...))`; `month=2026-13` gives `400`
   `{ error: 'month must be YYYY-MM' }`. Then add the handler in `usage.routes.ts`; route order is safe
   because `router.get('/')` only matches the exact path.
4. **Web.** `app/web/src/shared/api.ts`: add `usageCsvUrl(month)` next to `fetchUsage`.
   `app/web/src/features/usage/RecordsTable.tsx`: put an "Export CSV" `<button>` beside the
   heading, `disabled={usage.items.length === 0}`, `onClick` → `window.location.assign(
   usageCsvUrl(usage.month))` (the attachment header makes the browser download, not navigate).
   `app/web/src/styles.css`: one small `.panel-head` flex rule placed next to `.panel` (not at
   the end of the file, to avoid conflicts with EXP-102).
5. Run `pnpm install` (fresh worktree), `pnpm test`, `pnpm typecheck`.
6. `docs/tickets/EXP-104.md` stays unchanged here; its status is updated after merge, as for
   EXP-103/105.

Implementation per CLAUDE.md model routing: code written by a Sonnet subagent, checked here.

## Files to change

- `app/server/src/shared/time.ts`, `app/server/src/shared/time.test.ts`
- `app/server/src/features/usage/usage.csv.ts` (new), `usage.csv.test.ts` (new)
- `app/server/src/features/usage/usage.routes.ts`, `usage.routes.test.ts`
- `app/web/src/shared/api.ts`
- `app/web/src/features/usage/RecordsTable.tsx`
- `app/web/src/styles.css`
- `docs/plans/EXP-104-csv-export.md` (this plan)

## How to verify

- `pnpm test`: new tests fail before each implementation step and pass after; all existing tests
  still pass.
- `pnpm typecheck` passes for server and web.
- Manual in the browser pane, with `pnpm seed` and `pnpm dev`: pick 2026-09, click "Export CSV",
  check the response of `/api/usage/export.csv?month=2026-09` (headers, 347 rows + header, cost
  sum rounds to the $ total under the table); pick a month with no data (e.g. 2025-01) and check
  the button is disabled. Screenshot as proof.
- Before the MR: a review subagent gets `git diff --name-only main...HEAD` and this plan, and
  returns Summary, Critical/Major/Minor Issues, Obstacles Encountered, Approval Status.
- No commit, push or MR until asked; MR goes to GitLab `origin` with `glab`.
