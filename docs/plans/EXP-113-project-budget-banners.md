# EXP-113: Show a banner for each project that is near or over its budget

## Goal

On the current month, the dashboard shows one banner per project at `warning` or `exceeded`, right
below the company-wide banner and above the unpriced banner (spec R8 to R10). Data comes from
`GET /api/project-budgets`, fetched on its own so its failure does not stop the page. The page never
computes `percent` or `level`; it only orders banners by comparing shares in whole cents. Built
against the contract in the spec, with `fetch` stubbed; EXP-112 does not need to exist.

`app/web` gets its first test runner (Vitest + jsdom + Testing Library, approved by the user), so the
B-xx matrix rows become automated tests instead of browser checks.

## Steps

1. **Install and add the web test runner.** `pnpm install`. In `app/web` add only the approved
   devDependencies: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`. No
   `user-event`, no `jest-dom`. Use `fireEvent` and plain DOM assertions.
   - `app/web/package.json`: script `"test": "vitest run"`.
   - `app/web/vite.config.ts`: import `defineConfig` from `vitest/config`; add
     `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }`.
   - `app/web/src/test/setup.ts`: `afterEach(cleanup)` (no vitest globals).
   - **Root `pnpm test` (decided: yes):** change the root script to `pnpm -r test`, the same
     pattern as the existing `typecheck`, so one command runs server and web tests. Also change the
     `pnpm test` line in `CLAUDE.md` Commands to "server and web tests; one file: ...".
2. **Failing tests first** (see "Tests" below). Add small skeletons that compile and render nothing
   (`ProjectBudgetBanners` returns `null`, order function returns `[]`) so the tests fail on
   assertions, not on missing imports. Show the red run.
3. **API client** (`app/web/src/shared/api.ts`): types `ProjectBudget`
   (`project`, `budget: number | null`, `spent`, `ratio: number | null`, `percent: number | null`,
   `level: 'none' | 'ok' | 'warning' | 'exceeded'`), `ProjectBudgets` (`month`, `projects`), and
   `fetchProjectBudgets()` using the existing `getJson`. No change to `readJson` (EXP-114 needs the
   status; not this ticket).
4. **Order and banners** (`app/web/src/features/budget/`):
   - `projectBudgetOrder.ts`: keep `warning`/`exceeded`; sort exceeded before warning; then higher
     share first by comparing `s1 × b2` against `s2 × b1` with `s` and `b` in whole cents
     (`Math.round(x * 100)`); then name in code-point order (own `compareCodePoints`, not
     `localeCompare`, not `<` on UTF-16 units).
   - `ProjectBudgetBanners.tsx`: takes the budgets state. `loading` renders nothing; `error` renders
     `<p className="error">Could not load project budgets: {message}</p>` (same element and class as
     the existing "Could not load data" line); `ready` renders one `<div className="banner
     banner-{level}" role="alert">` per project, same markup as `BudgetBanner`, text
     `Budget warning|exceeded for {project}: {formatUsd(spent)} of {formatUsd(budget)} spent this
     month ({percent}%).` with `percent` straight from the API. Key = project name.
   - `useProjectBudgets.ts`: hook `useProjectBudgets(reloadKey)` returns
     `{ status: 'loading' } | { status: 'error'; message } | { status: 'ready'; projects }`. Effect on
     `[reloadKey]` only (not on `month`: the API is current-month only). Each run sets `loading`
     first, fetches, ignores stale responses with a `cancelled` flag. Setting `loading` on every
     reload is what the ticket asks for after a usage record is added: banners go with the rest and
     come back when both loads finish (without it, old banners could show next to the new month data).
     EXP-114 will add a budgets-only reload that keeps the old state; the hook is the place for it.
5. **`App.tsx`**: call the hook with the existing `reloadKey`; inside the `ready` block, replace
   `{summary.isCurrentMonth && <BudgetBanner .../>}` with that condition wrapping `<BudgetBanner/>`
   then `<ProjectBudgetBanners/>`, before `<UnpricedBanner/>`. The error line therefore shows only
   when the summary has loaded and `isCurrentMonth` is true. The budgets fetch is outside the month's
   `Promise.all`. No other change to `App.tsx`.
6. **Docs**: mark EXP-113 `Done` in `docs/tickets/README.md`. Update the ticket's "Repro" paragraph
   (no longer "no test runner"; now automated tests). `spec.md`: only concern 4 ("No automated check
   for the web part") changes, to say a runner was approved and the web tests exist; no requirement
   text (R8 to R10) changes. I will not touch other parts of `spec.md` (merge conflict risk with
   EXP-112). If the user prefers, I leave `spec.md` alone.
7. **Check**: `pnpm test`, `pnpm typecheck`; browser check (see How to verify).
8. Stop; ask the user to type `/ship-ticket EXP-113`. Then commit, push, open the MR.

## Tests (B-xx rows)

Test stubs use `vi.stubGlobal('fetch', ...)` with a small router by URL (`/api/summary`,
`/api/usage`, `/api/models`, `/api/project-budgets`) in `app/web/src/test/fakeApi.ts`; the stub's
`isCurrentMonth` is `month === thisMonth()`. Colocated `*.test.ts(x)`; no existing test is touched.

| File | Rows covered |
|---|---|
| `features/budget/projectBudgetOrder.test.ts` (pure) | B-04 order `b`, `c`, `a`; B-05 equal share by name, code points (`B` before `a`); cents compare (`2.40/3.00` vs `0.80`-type ties that float gets wrong); levels `none`/`ok` dropped (B-03) |
| `features/budget/ProjectBudgetBanners.test.tsx` | B-01 warning text and `banner-warning`; B-02 exceeded text and `banner-exceeded`; B-03 no banner for `ok`/`none`; B-14 shows API `percent` 81 for `ratio` 0.8199; B-09 error line text, no banners; B-10 `loading` renders nothing |
| `App.test.tsx` (whole page, stubbed `fetch`) | B-06 order: company banner, project banner, unpriced banner; B-07 past month: no project banners and no error line (also with a failing budgets request); B-08 / scenario 7: add a record through the Add record form, budgets are fetched again, warning banner appears, no page reload; B-09 failed budgets request: one error line, no banner, rest of page (summary cards, tables) shows; B-10 slow budgets request: empty banner area until it resolves; B-12 failed reload after add record = same as B-09; B-13 summary fails: "Could not load data", no banners and no budgets error line; B-15 add record: "Loading…" shows, banners come back only after both loads finish; budgets are not refetched on a month change |

Expected: about 25 tests across 3 files.

**Not automated:**
- **B-11** (banners stay while only the budgets reload, after Save in EXP-114): the trigger does not
  exist until EXP-114. The keep-old-data behaviour is built in EXP-114 and its test is written there.
  Not checked in this ticket.
- **How the banners look** (warning vs exceeded colours): tests assert the CSS class, which reuses the
  existing styles; the look is checked once in the browser.

## MINOR questions that touch EXP-113 (zero-questions round 5, #4 and #9)

| # | Settled how |
|---|---|
| 9: `role="alert"` and the error line's class | Banners: `role="alert"` and `banner banner-{level}`, as `BudgetBanner` and `UnpricedBanner`. Error line: `<p className="error">`, no role, as "Could not load data". |
| 4: browser `thisMonth()` vs server time zone at a month boundary | Not affected: banners use `summary.isCurrentMonth` from the server, not `thisMonth()`. Left to the EXP-114 plan for the form. |
| Others (#1 to #3, #5 to #8) | EXP-114 or EXP-112, not this ticket. |

No question found that changes what a user sees and that the ticket and spec leave open, so I do not
plan to ask the client anything. If one appears during the build, I stop and ask.

## Files to change

- `app/web/package.json`, `pnpm-lock.yaml` (4 devDependencies, `test` script)
- `app/web/vite.config.ts` (test config)
- `app/web/src/test/setup.ts`, `app/web/src/test/fakeApi.ts` (new)
- `app/web/src/shared/api.ts` (types + `fetchProjectBudgets`)
- `app/web/src/features/budget/projectBudgetOrder.ts`, `ProjectBudgetBanners.tsx`,
  `useProjectBudgets.ts` (new) and their tests; `app/web/src/App.test.tsx` (new)
- `app/web/src/App.tsx` (hook call and placement)
- `package.json` (root `test` script, if the user says yes); `CLAUDE.md` Commands line (same condition)
- `docs/tickets/README.md` (EXP-113 `Done`), `docs/tickets/EXP-113.md` (Repro),
  `docs/capstone/project-budgets/spec.md` (concern 4 only), `docs/plans/EXP-113-project-budget-banners.md`

Reused: `formatUsd` (`shared/format.ts`), `getJson` (`shared/api.ts`), `BudgetBanner` markup and the
`.banner`, `.banner-warning`, `.banner-exceeded`, `.error` CSS. No new CSS.

## How to verify

1. Red: new tests fail on the skeletons. Green after the code.
2. `pnpm test` and `pnpm typecheck` pass; report test counts for server and web. Server tests and
   existing assertions untouched.
3. Browser check, only if ports 4000 and 5173 are free: `pnpm dev`; without the EXP-112 endpoint, route
   `/api/project-budgets` in the browser (Playwright MCP route) with warning, exceeded, `ok` and
   `none` projects plus a 500 case; check order, text, placement under the company banner, past month,
   and the error line. Not checked: the real endpoint end to end (needs EXP-112 merged), and the
   record-added reload against a real server.
