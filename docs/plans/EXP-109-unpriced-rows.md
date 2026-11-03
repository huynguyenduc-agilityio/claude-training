# EXP-109: One usage row without a price breaks every read of its month

## Goal

A row with no price no longer takes down its month. Reads answer `200`, the row is flagged with
`cost: null`, money totals leave it out, and the summary counts it in `unpricedCount`. Posting works
again, and the dashboard says that totals are incomplete.

Decisions:

- Flag, not skip: the person fixing the data can see which rows are affected, and
  `items.length === recordCount` still holds (EXP-101 test).
- `PricedUsageRecord.cost` stays `number`. A new `UnpricedUsageRecord` has `cost: null`, and
  `MonthlyUsage.items` holds either. `usage.csv.test.ts:26` adds `row.cost` over
  `PricedUsageRecord[]`, so widening `cost` itself would break the type check of an existing test.
- `summarizeMonth` omits `unpricedCount` when it is 0, because `summary.test.ts:55` compares the
  whole object with `toEqual`. The route always answers a number, with `?? 0`. `listMonth` gets no
  new field, for the same reason at `usage.query.test.ts:63`; the count there comes from `items`.
- `findPrice` returns `undefined` when there is no price, and `getPrice` becomes a wrapper that
  throws. No try/catch in the read paths: catching would also hide a malformed price table.
- `getPrice` has no production caller after this. It stays because EXP-107's criteria and tests
  require it.
- "No price at this timestamp" counts as no price, same as an unknown model. `pricing.json` cannot
  produce it today, since every model has a period without `from`, but the read path must not
  depend on that.
- A new record with no price at its timestamp is still saved. Rejecting it would be a validation
  change, outside this ticket.
- No logging per row: it would fire on every read. The dashboard banner is the signal.
- Out of scope: migrating or deleting rows, and a test job in CI.

## Steps

1. Add failing tests, without changing any existing test:
   - `pricing.test.ts`: `findPrice` returns the price; `undefined` for an unknown model, for
     `constructor`, and for a timestamp before the first period.
   - `cost.test.ts`: `costOf` returns the cost, or `null` in those three cases.
   - `usage.query.test.ts`: a month with one priced and one unknown row keeps both, newest first;
     the unknown row has `cost: null`; `totalCost` is only the priced row.
   - `summary.test.ts`: same data; `recordCount` 2, `totalCost` of the priced row, `byModel` and
     `byProject` without the unknown row, `unpricedCount` 1.
   - `usage.csv.test.ts`: a `cost: null` item writes an empty last cell.
   - `usage.routes.test.ts`, new `describe` with its own in-memory database (the existing one shares
     a repository): a row saved directly with `constructor` and one with a removed model; `GET
     /api/usage` and `GET /api/usage/export.csv` answer `200` with the flagged rows.
   - `summary.routes.test.ts`, new `describe` with its own database: `200`, `unpricedCount` 1,
     `budget.spent` equals the usage `totalCost`; `unpricedCount` is 0 in a month with no such row.
   - `budget.alert.routes.test.ts`: with such a row in the current month, a valid `POST` answers
     `201` and an invalid one `400`; the row counts as $0 towards the threshold; a new record whose
     model's first period starts in the future answers `201`, is saved, and does not notify.
2. Run the tests and show that the new ones fail, and why. Fill in the ticket's Repro from it.
3. Server: add `findPrice` and rewrite `getPrice` on it in `pricing.ts`. Add `costOf(record, pricing)`
   to `cost.ts`. Use it in `listMonth`, `summarizeMonth` and `budget.alert.ts:79`, where a `null`
   cost returns the record without a budget check. In `toUsageCsv`, write `''` for `cost: null`, as
   for null cached tokens. In `summary.routes.ts`, answer `unpricedCount ?? 0`.
4. Web: `cost: number | null` and `unpricedCount: number` in `api.ts`; `—` in `RecordsTable.tsx`; new
   `UnpricedBanner.tsx` using the existing `banner banner-warning` classes, rendered in `App.tsx` for
   any month: "1 record has no price and is not included in the totals." / "N records have no price
   and are not included in the totals."
5. Mark EXP-109 `Done` in `docs/tickets/README.md`.
6. Run `pnpm test` and `pnpm typecheck`, and show the output.
7. Check the dashboard in the browser against a temporary database (`DB_PATH`) that holds a
   `constructor` row, and take a screenshot. `data/usage.db` is not touched.
8. Commit on this branch: `fix(usage): keep a month readable when a row has no price (EXP-109)`.
9. Run `/ship-ticket EXP-109`. Its checks apply; its description goes in a GitHub pull request.
10. Push to the `github` remote as `fix/exp-109` and open a pull request against `main` with What,
    Why, How tested and Notes for reviewer.
11. Go through the review's comments one by one. Fix only what is accepted. Merge only on the user's
    word.

## Files to change

- `app/server/src/features/pricing/pricing.ts`, `pricing.test.ts`
- `app/server/src/features/usage/cost.ts`, `cost.test.ts`
- `app/server/src/features/usage/usage.query.ts`, `usage.query.test.ts`
- `app/server/src/features/usage/usage.csv.ts`, `usage.csv.test.ts`
- `app/server/src/features/usage/usage.routes.test.ts`
- `app/server/src/features/summary/summary.ts`, `summary.test.ts`
- `app/server/src/features/summary/summary.routes.ts`, `summary.routes.test.ts`
- `app/server/src/features/budget/budget.alert.ts`, `budget.alert.routes.test.ts`
- `app/web/src/shared/api.ts`
- `app/web/src/features/usage/RecordsTable.tsx`
- `app/web/src/features/summary/UnpricedBanner.tsx` (new)
- `app/web/src/App.tsx`
- `docs/tickets/EXP-109.md` (new), `docs/tickets/README.md`
- `docs/plans/EXP-109-unpriced-rows.md` (this plan)

## How to verify

- `pnpm test`: the new tests fail before step 3 and pass after; all existing tests still pass with
  no assertion changed. `git diff` on the test files shows only added lines.
- `pnpm typecheck` passes for server and web.
- The route tests drive the real app over HTTP with an in-memory database and rows inserted
  directly, so they cover the ticket's repro end to end.
- The web has no tests, so the banner and the `—` are checked in the browser (step 7).
