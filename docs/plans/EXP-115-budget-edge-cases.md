# EXP-115: Fix project budget edge cases found in the Day 14 review

## Goal

Make project budgets behave the same for every project name and every amount the app accepts
(spec R1, R8, R11 to R13 and the API contract). Four defects, one failing test per scenario of
`docs/tickets/EXP-115.md`:

- **A** `GET /api/project-budgets` sorts by UTF-16 code unit; the spec says code point.
- **B** `POST /api/usage` rejects the project names `.` and `..` (client decision 2026-11-16).
- **C** The "Project budgets" form keeps row state in a plain object; `constructor`, `toString`,
  `__proto__` hit inherited properties.
- **D** Banner order compares shares with `s1 × b2` in JS numbers; above `2^53` two different shares
  compare as equal.

No other response, text or order changes. Records stored before this change are not migrated.

## Steps

Questions: none. The ticket answers every user-visible point (error text, `...`/`.hidden`/`a.b` stay
valid, error order after `project is required`). Assumptions, shown here so the user can correct them:

- The check is an exact match on the stored value: `" . "`, `"./"`, `"%2E"` stay valid names (only the
  exact strings `.` and `..` are dot segments for the URL parser).
- The new check runs where `project` is parsed today, so a record with a bad timestamp/model still
  reports that error first, and a bad project reports before the token-count errors.

1. **Setup.** `pnpm install` in the worktree. No new dependency.
2. **Red first.** Add the tests below, run them, show the failures. No skeletons needed: no new
   exports, the tests fail on assertions. No existing assertion or expected value is touched.
3. **A. Server sort** (`project-budget.status.ts`): replace `byCodePoint` (`a < b`, UTF-16) with a real
   code point comparison, comparing `codePointAt` over `Array.from` like the web's `compareCodePoints`.
   Keep the helper local to the server (the two apps share no code).
4. **B. Usage validation** (`usage.validation.ts`): after `requireString(input, 'project')`, throw
   `ValidationError('project must not be "." or ".."')` when `project === '.' || project === '..'`.
   The route already turns `ValidationError` into `400 {error}` and stores nothing.
5. **C. Form row state** (`ProjectBudgetsSection.tsx`): `rows` becomes a `Map<string, RowState>`
   (`useState(new Map())`, `get ?? NEW_ROW`, `set` on a copy). No object keyed by a project name is left.
6. **D. Exact share compare** (`projectBudgetOrder.ts`): `compareShares` converts the cents to `BigInt`
   (`BigInt(toCents(x))`) and returns `-1 | 0 | 1` from comparing `s2 × b1` with `s1 × b2`. Same
   ordering as today wherever today is exact. `toCents` rounds to a whole number, so `BigInt` never
   throws; ES2022 target already allows it.
7. **Docs.**
   - `docs/capstone/project-budgets/spec.md`: API section, `projects` bullet and banner order bullet
     say "exact comparison (integer arithmetic, no precision loss above 2^53)"; add the usage rule
     (new bullet under R4 or in a short "Usage records" note: `project` must not be `.` or `..`,
     with the reason: URL parser shortens it, `%2E` does not help; stored `.`/`..` records are not
     migrated). Update the `:project` line accordingly.
   - `docs/tickets/EXP-115.md`: fill the Repro section (steps and observed result per defect).
   - `docs/tickets/README.md`: row EXP-115 to `Done`.
   - Save this plan as `docs/plans/EXP-115-budget-edge-cases.md`.
8. **Verify.** `pnpm test`, `pnpm typecheck`, one repro of A, B, C, D each through the tests.

## Files to change

| File | Change |
|---|---|
| `app/server/src/features/budget/project-budget.status.ts` | code point comparator (A) |
| `app/server/src/features/usage/usage.validation.ts` | `.`/`..` check (B) |
| `app/web/src/features/budget/ProjectBudgetsSection.tsx` | `Map` row state (C) |
| `app/web/src/features/budget/projectBudgetOrder.ts` | `BigInt` share compare (D) |
| `app/server/src/features/budget/project-budget.routes.test.ts` | scenario 1 |
| `app/server/src/features/budget/project-budget.status.test.ts` | scenario 1 (unit) |
| `app/server/src/features/usage/usage.routes.test.ts` | scenarios 2 and 3 over HTTP |
| `app/server/src/features/usage/usage.validation.test.ts` | scenarios 2 and 3 (unit) |
| `app/web/src/features/budget/ProjectBudgetsSection.test.tsx` | scenario 4 |
| `app/web/src/features/budget/projectBudgetOrder.test.ts` | scenario 5 (unit) |
| `app/web/src/features/budget/ProjectBudgetBanners.test.tsx` | scenario 5 (rendered banners) |
| `docs/capstone/project-budgets/spec.md`, `docs/tickets/EXP-115.md`, `docs/tickets/README.md`, `docs/plans/EXP-115-budget-edge-cases.md` | docs |

New tests are added in new `it`/`describe` blocks only.

## How to verify

One failing test per scenario, written first and shown red:

| # | Test | Fails today because |
|---|---|---|
| 1 | routes: usage for `proj-～` (U+FF5E) and `proj-😀` (U+1F600); `GET /api/project-budgets` lists `proj-～` first. Unit twin on `listProjectBudgets`. | UTF-16 puts U+1F600 (`D83D`) before U+FF5E |
| 2 | `it.each(['.', '..'])` on `POST /api/usage`: 400, body `{"error":"project must not be \".\" or \"..\""}`, `repository.listAll()` empty. Unit twin on `parseNewUsageRecord`. Also: empty project still gives `project is required`. | accepted today (201) |
| 3 | `it.each(['...', '.hidden', 'a.b'])` on `POST /api/usage`: 201. Passes before and after; guards over-blocking. | (guard, green) |
| 4 | `it.each(['constructor','toString','__proto__'])` in the Section test: stub PUT 200 and a refresh that returns the project with budget 10; type 10, Save, row shows "Saved" and `$10.00`; then stub PUT 400 `budgetUsd must have at most 2 decimals`, type 10.005, Save, the alert shows that text. | row state is the inherited property: no "Saved", no error text |
| 5 | `bannerProjects` with `a` (999999.99 budget, 2999999.96 spent) and `b` (1000000 budget, 2999999.99 spent), both `exceeded`, input order `[a, b]`: result `['b', 'a']`. Rendered twin in `ProjectBudgetBanners.test.tsx`: `b` banner before `a` banner. | products round to the same double, difference 0, falls back to name order (`a` first) |

Then: `pnpm test` and `pnpm typecheck` green; the red run output saved in the report. After
implementation, ticket Repro filled with each defect's steps and result; README row `Done`.

Not verified in a real browser: the `.`/`..` URL shortening is from the ticket (already tested
by the owner); the tests check the server rule only.

## After approval

Stop and ask the user to type `/ship-ticket EXP-115` in this session. Then, with approval given in
this session: commit (`fix(budget): ... (EXP-115)`, no AI attribution); push to GitLab `origin` and the
GitHub mirror (CI); tell the user the CI run for `/loop`; open the GitLab MR (What, Why, How tested,
Notes for reviewer, CI link); merge on GitLab only when mergeable, CI green and self-run checks pass.
