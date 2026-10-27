# Test coverage audit: `app/server/src` (cloud session)

Audit of the server test suite at `main` `c0257f9`. For every exported function and route: which
tests cover it, and which edge cases are missing, ranked by risk. No source or test file was
changed.

## Summary

- **Scope:** 21 runtime exports and 5 routes in 17 source files (`usage.ts` holds types only);
  10 test files, 43 tests.
- **Suite status:** `pnpm test` 43/43 passed, `pnpm typecheck` clean.
- **Method:** static mapping of each test to the code it exercises (`file:line` below), then a
  throwaway probe script (scratchpad, not committed) run against the real modules and an in-memory
  app to check each suspected gap. Findings are marked **confirmed** (reproduced) or **by reading**.
- **No line-coverage numbers:** no coverage provider (`@vitest/coverage-v8`) is installed, and
  adding a dependency needs approval. See [Next steps](#next-steps).

Top risks, all **confirmed**:

1. One `POST /api/usage` with `inputTokens: 9007199254740994` is accepted and stored; from then on
   `listAll()` throws and **every** `GET /api/usage` and `GET /api/summary` returns 500, for all
   months.
2. One `POST` with `model: "constructor"` (or `toString`, `__proto__`) returns 201; every `GET` for
   that month returns 500.
3. `cachedInputTokens` larger than `inputTokens` is accepted; the record costs a negative amount
   (100 input, 1,000,000 cached → **-$0.8999**).
4. The timestamp check accepts non-ISO input (`"1"` → 2001-01-01, `"10/02/2026"`) and zone-less
   times are read in the **server's** local time zone.
5. A malformed JSON body (or a JSON `null`) returns **500** instead of 400.

## Coverage matrix

Level: **direct** = a test calls it with chosen inputs; **indirect** = only reached through another
unit or route; **none** = never executed by the suite.

| Export / route | Source | Covering tests | Level |
|---|---|---|---|
| `GET /api/health` | `app.ts:28` | none | none |
| `GET /api/models` | `app.ts:31` | none | none |
| `createApp` + `handleErrors` | `app.ts:15-39` | 400 branch: `usage.routes.test.ts:41`; app built in both route tests | indirect; 500 branch none |
| `GET /api/usage` | `usage.routes.ts:27` | `summary.routes.test.ts:57` (only as a comparison for summary) | indirect |
| `POST /api/usage` | `usage.routes.ts:32` | `usage.routes.test.ts:41` (400 for negative tokens only) | direct, error path only |
| `GET /api/summary` | `summary.routes.ts:18` | `summary.routes.test.ts:49`, `:57` | direct, happy path only |
| `readMonth` | `usage.routes.ts:16` | valid month via the two summary route tests | indirect; error and default branches none |
| `createUsageRouter` / `createSummaryRouter` | `usage.routes.ts:24`, `summary.routes.ts:15` | via `createApp` in route tests | indirect |
| `loadConfig` | `config.ts:15` | none | none |
| `openDatabase` | `shared/db.ts:16` | `:memory:` in repository and route tests | indirect; file-path branch none |
| `ValidationError` | `shared/errors.ts:2` | message checks in `usage.validation.test.ts`; 400 mapping in `usage.routes.test.ts:41` | indirect |
| `roundCents` | `shared/money.ts:2` | via `summary.test.ts:29`, `usage.query.test.ts:30` | indirect |
| `isMonthKey` | `shared/time.ts:3` | `time.test.ts:5`, `:9` | direct |
| `toMonthKey` | `shared/time.ts:6` | `time.test.ts:17`, `:21`; time zone via `summary.test.ts:84` | direct |
| `currentMonthKey` | `shared/time.ts:17` | `time.test.ts:28` (explicit `now` only) | direct |
| `budgetStatus`, `WARNING_RATIO` | `budget/budget.ts:13`, `:11` | `budget.test.ts:5`, `:9`, `:13`, `:17`; ratio via `summary.routes.test.ts:57` | direct |
| `loadPricing` | `pricing/pricing.ts:24` | `pricing.test.ts:41`; real file `:54`, `:59` | direct |
| `getPrice` | `pricing/pricing.ts:35` | `pricing.test.ts:16`, `:20`, `:25`, `:33` | direct; `No price for` branch none |
| `summarizeMonth` | `summary/summary.ts:39` | `summary.test.ts:29`, `:36`, `:45`, `:54`, `:64`, `:84` | direct |
| `calculateCost` | `usage/cost.ts:9` | `cost.test.ts:7`, `:16`, `:25` | direct |
| `recordsInMonth` | `usage/usage.query.ts:18` | via `listMonth` and `summarizeMonth` tests | indirect |
| `listMonth` | `usage/usage.query.ts:25` | `usage.query.test.ts:24`, `:30`, `:37`, `:62` | direct |
| `createUsageRepository` (`insert`, `listAll`, `clear`) | `usage/usage.repository.ts:30` | `usage.repository.test.ts:15`, `:24` | direct, `cachedInputTokens: null` only |
| `parseNewUsageRecord` | `usage/usage.validation.ts:29` | `usage.validation.test.ts:15`, `:23`, `:29`, `:35`, `:41`, `:50`, `:59` | direct |
| `index.ts` bootstrap | `index.ts` | none (no exports, starts the server) | none, acceptable |

## Missing edge cases, ranked by risk

Risk weighs how likely the input is (anything a client can POST is likely) against the damage
(wrong money, or the dashboard down until someone edits the database).

### High

**H1. Unsafe integer poisons the whole database** — **confirmed**
- `requireInteger` (`usage.validation.ts:15-19`) uses `Number.isInteger`, which is true for
  `2 ** 53 + 2` and for `1e300`. The insert succeeds; `listAll()` (`usage.repository.ts:50`) then
  throws `Value is too large to be represented as a JavaScript number`. Both GET routes read
  `listAll()` for every request, so all months return 500. `1e300` is stored as a REAL and read back
  as `1e+300`, giving absurd costs instead of a crash.
- Missing tests: validation rejects counts above `Number.MAX_SAFE_INTEGER`; repository round-trip
  of a large but safe count.

**H2. Model names inherited from `Object.prototype` pass validation** — **confirmed**
- `if (!pricing[model])` (`usage.validation.ts:41`) is truthy for `constructor`, `toString`,
  `__proto__`. POST returns 201; then `getPrice` (`pricing.ts:36-39`) gets a function or object
  instead of an array and throws, so `GET /api/usage` and `GET /api/summary` for that month
  return 500 until the row is deleted.
- Missing tests: `parseNewUsageRecord` rejects `constructor`, `toString`, `__proto__`; `getPrice`
  throws `Unknown model` for the same keys.

**H3. Cached tokens larger than input tokens** — **confirmed**
- Validation checks `cachedInputTokens` only for integer and non-negative
  (`usage.validation.ts:43-47`). `calculateCost` computes `uncached = inputTokens - cached`
  (`cost.ts:11`), which goes negative: 100 input, 1,000,000 cached → **-$0.8999**. The negative cost
  flows into totals, breakdowns and the budget.
- Missing tests: validation rejects `cachedInputTokens > inputTokens` (and accepts equal);
  `calculateCost` with `cached === input`.

**H4. Timestamp accepts non-ISO and zone-less input** — **confirmed**
- `Date.parse` (`usage.validation.ts:36`) accepts `"1"` (→ `2001-01-01T00:00:00.000Z`),
  `"10/02/2026"` and `"2026-10-02"`. A zone-less `"2026-10-01T03:00:00"` becomes
  `2026-09-30T20:00:00.000Z` on a server with `TZ=Asia/Ho_Chi_Minh` but `2026-10-01T03:00:00.000Z`
  on a UTC server: the stored instant, and therefore the price period (`lyra-flash` changes price
  at `2026-10-01T00:00:00Z`), depends on where the API runs. The error message promises ISO 8601;
  only `"yesterday"` is tested (`usage.validation.test.ts:59`).
- Missing tests: reject `"1"`, `"10/02/2026"`, and a date-time without `Z` or offset; accept an
  explicit offset such as `+07:00` and normalise it to UTC.

**H5. Error handler turns client errors into 500** — **confirmed**
- `handleErrors` (`app.ts:15-22`) maps only `ValidationError` to 400. `express.json()` raises its
  own 400-status error for a malformed body, which is returned as
  `500 {"error":"Internal server error"}`. The same happens for JSON bodies `null` and `"abc"`,
  which the strict JSON parser rejects before `parseNewUsageRecord` runs. The
  `Body must be a JSON object` branch (`usage.validation.ts:30-32`) is reachable only when the
  request has no JSON content type (400). Neither the 500 branch nor the parse-error case is tested.
- Also untested at route level: `POST /api/usage` happy path (201 and returned body with `id`),
  unknown model → 400, a body without a JSON content type → 400.

**H6. Read-time pricing failures** — **confirmed**
- `getPrice` throws `No price for <model> at <timestamp>` (`pricing.ts:40`) when every period has a
  `from` after the record; untested.
- A model removed from `pricing.json` while its records stay in the database: `GET /api/usage`
  returns 500 for that month.
- A `from` that does not parse (`"not-a-date"`): `startOf` returns `NaN` (`pricing.ts:20-21`), the
  sort comparator returns `NaN`, and `getPrice` silently skips the period (confirmed: the older
  price is used). Nothing in `loadPricing` validates the file.
- Missing tests: the `No price` branch; `loadPricing` rejects an invalid `from`, an empty period
  list, and a model whose first period has a `from` (or the route turns these into a clear error).

### Medium

**M1. `readMonth` error and default branches** — confirmed for errors
- `?month=2026-13` and `?month=2026-10&month=2026-09` return 400 (`usage.routes.ts:18-20`), but no
  test asserts it on either route. A missing `month` falls back to the current month in the
  configured time zone (`usage.routes.ts:17`); untested, needs fake timers near a month boundary.

**M2. Invalid `APP_TIMEZONE` fails per request, not at startup** — **confirmed**
- `loadConfig` (`config.ts:18`) accepts any string. With `Mars/Base`, `toMonthKey` throws
  `RangeError` and both GET routes return 500 whenever a record exists or `month` is omitted; with
  an empty database and an explicit month the error is hidden (200).
- Missing tests: `loadConfig` rejects an unknown time zone; `toMonthKey` with an invalid zone and an
  invalid timestamp.

**M3. `loadConfig` has no tests at all** — confirmed
- Non-numeric value throws (good, untested). Empty string → default. `" "` → `Number(" ") === 0`, so
  `API_PORT=" "` listens on a random port. `"Infinity"` and negative budgets are accepted; a
  negative budget silently disables the budget (`budgetStatus(10, -5).level === 'ok'`).

**M4. Rounding: totals and breakdowns can disagree** — **confirmed**
- Each breakdown group is rounded on its own (`summary.ts:43`) while `totalCost` rounds the raw sum
  (`summary.ts:54`). Three projects at $0.005 each give `totalCost 0.02` but `byProject` costs that
  sum to `0.03`. `listMonth` items carry unrounded costs while the total is rounded
  (`usage.query.ts:34-39`). `roundCents(1.005) === 1` because of binary floating point.
- Missing tests: `roundCents` directly (half-cent cases, negatives); a summary where the sum of
  breakdown costs is checked against `totalCost` (decide the rule first; this may need a ticket).

**M5. `budgetStatus` boundaries**
- Covered: 25%, exactly 80%, exactly 100%, budget 0. Missing: just below 80% and 100% (31.99/40, 39.99/40),
  spent above budget (confirmed `exceeded`), negative budget, and the `level` field through
  `GET /api/summary` (`summary.routes.test.ts` checks only `spent` and `ratio`).

**M6. `toMonthKey` boundaries**
- Covered: one positive-offset zone at the end of September. Missing: December → January year
  boundary, a negative-offset zone (`America/Los_Angeles` at `2026-11-01T05:00:00Z` is still
  October), and DST transitions.

**M7. Repository details**
- Missing: round-trip of a numeric `cachedInputTokens` (confirmed works), `listAll` ordering by
  timestamp, id after `clear()` (confirmed: AUTOINCREMENT continues at 2, which is fine but
  undocumented).

### Low

**L1. Ordering ties**
- `listMonth` sorts by timestamp string (`usage.query.ts:36`); equal timestamps keep input order.
  `groupCost` sorts by rounded cost (`summary.ts:35`); equal costs keep first-seen order. Neither
  tie is tested, so a refactor could make the dashboard order unstable.

**L2. `isMonthKey` shapes**
- Missing: `"2026-00"`, `"0000-01"` (accepted), surrounding whitespace, `"2026-10-01"`.

**L3. `calculateCost` corners**
- Well covered. Missing only all-zero tokens and a zero price; low value.

**L4. Thin infrastructure**
- `openDatabase` with a file path (directory creation, `:17`) and re-opening an existing file
  (schema is `IF NOT EXISTS`). `GET /api/health`, `GET /api/models`. `ValidationError.name`.
  `index.ts` is a bootstrap; covering it would need a process-level smoke test and is not worth it.

## Next steps

1. Turn H1 to H6 into tickets. Each gets a failing test first (the cases above), then the fix. H1,
   H2 and H3 are one-line validation fixes with high payoff; H4 needs a decision on which formats
   to accept.
2. M4 needs a product decision (round per row, or derive breakdowns from rounded rows) before a
   test can be written.
3. With approval, add `@vitest/coverage-v8` as a dev dependency so later audits can quote line and
   branch numbers instead of a manual mapping.
