# Exercise: a bug ticket through the full loop in the Code tab

Two tickets, each taken from ticket to MR: ambiguities, plan, failing test, fix, checks, commit,
MR. Claude ran each step in the session; I made every decision (ambiguities, plan approval,
commit, push, MR).

## EXP-105: API accepts negative token counts

- **Branch / MR:** `fix/EXP-105`, [MR !3](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/3)
- **Plan:** `docs/plans/EXP-105-reject-negative-tokens.md` (on the branch)

### Ambiguities and decisions

| Question | Decision |
|---|---|
| `cachedInputTokens > inputTokens` keeps the cost negative even with no negative field | Out of scope; noted in the MR as a follow-up |
| Error message | `<field> must not be negative`, so the existing `must be an integer` test stays unchanged |
| Test level | Unit tests for the three fields and for zero, plus one `POST /api/usage` route test |

### Result

- 4 new tests failed first (`expected 201 to be 400`), then passed after adding
  `requireNonNegative` / `requireCount` in `usage.validation.ts`.
- `pnpm test` 34/34, `pnpm typecheck` pass; manual `POST` with each negative field returns `400`.
- Diff checks: no unrequested changes, no weakened tests, no new packages, no hard-coded values.

## EXP-103: lyra-flash costs higher than the provider invoice

- **Branch / MR:** `fix/EXP-103`, [MR !4](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/4)
- **Plan:** `docs/plans/EXP-103-dated-lyra-flash-price.md` (on the branch)

### Ambiguities and decisions

| Question | Decision |
|---|---|
| Effective date (not in the ticket) | 2026-10-01, the day 2 default; to confirm with the Platform team |
| Time zone of the change | 00:00 UTC; record timestamps are UTC |
| Cached input price (not in the ticket) | Unchanged at $0.03; to confirm |
| How to store dated prices | Every model is a list of price periods; `getPrice(table, model, timestamp)` |
| Existing tests break on the new `PriceTable` shape | Approved: wrap each fixture price in a list, no expected value changes |

### Result

- 6 new tests failed first (real `pricing.json` still gave lyra-flash $0.30 on 2026-10-01), then
  passed after the fix.
- `pnpm test` 37/37, `pnpm typecheck` pass.
- Local sample data: October lyra-flash $1.00 to $0.73, total $14.90 to $14.63; September and the
  orion models unchanged.

## What I learned

- The ambiguities were where the real decisions were: both tickets left out something that
  changed the design (EXP-103's date) or the scope (EXP-105's cached > input case).
- Writing the failing test first proved the bug before any fix: `201` instead of `400`, and the old
  price on the day of the change.
- A data-shape change can force edits to existing tests. Stating it in the plan and getting
  approval kept the "do not edit tests to make them pass" rule intact.
- Steering with a hunk comment (d4-10): on MR !4, line 28 of `pricing.ts`, I commented that
  `findLast` assumes periods are sorted oldest first. Claude answered with a failing test (a
  reversed `pricing.json` picked the old price on 2026-10-01) and a fix that sorts periods in
  `loadPricing` (87f693a, ef1bebf), then replied on the thread. A comment on one line is more
  precise than a paragraph in chat: it points at the exact code and becomes the review record.
