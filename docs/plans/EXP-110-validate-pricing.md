# EXP-110: An invalid pricing.json is accepted silently and gives wrong costs

## Goal

`loadPricing` rejects an invalid price table at startup with a message that names the model, the
period and the reason, so a typing mistake stops the server instead of producing wrong costs.

Decisions:

- Fail at startup, do not skip the bad entry. Skipping would keep the silent wrong number that this
  ticket removes. `index.ts` has no try/catch around `loadPricing()`, so the process exits.
- A plain `Error`, not `ValidationError`. `ValidationError` means a `400` for a bad API request; this
  is a broken server file.
- Stop at the first problem. The file is small and edited by hand.
- `from` must match `YYYY-MM-DDTHH:mm:ssZ`, with optional fractional seconds, and be a real instant:
  `Date.parse` rolls `2026-02-30` over to March, so the date part must survive a round trip.
  `CLAUDE.md` documents `from` as ISO 8601 UTC. `Date.parse` alone is not enough: it also accepts
  `Oct 1 2026` and `2026-10-01T00:00:00`, which read as local time.
- A price of `0` is valid, for a free model. Extra fields in a period are ignored.
- Model names are not checked: `isKnownModel` already handles them (EXP-107).
- Out of scope: two periods with the same start, a schema library (no new dependency), and rows
  already priced with a wrong value.

Checked after the first commit: the runtime accepts `2026-02-30T00:00:00Z`. `/code-review` raised
it, the owner chose to fix it, and step 10 adds the check and its test. The same review added the
rule that a table with no models is invalid.

## Steps

1. Add failing tests to `pricing.test.ts`, without changing any existing test. In
   `describe('loadPricing')`, write a temporary file as the existing test does:
   - throws, naming model, period and reason, for each invalid case in the ticket's criteria
   - loads a price of `0`, a period without `from`, and a model whose periods all have `from`
   - the real `pricing.json` loads
2. Run the tests and show that the new ones fail, and why. Fill in the ticket's Repro from it.
3. In `pricing.ts`, add `assertValidPriceTable(table: unknown)` and call it in `loadPricing` before
   sorting. Replace the `as PriceTable` cast with the assertion.
4. Mark EXP-110 `Done` in `docs/tickets/README.md`, and add the row.
5. Run `pnpm test` and `pnpm typecheck`, and show the output.
6. Start the API once with `pricing.json` temporarily broken, show that the process exits with the
   message, and restore the file with `git restore`.
7. Commit: `fix(pricing): reject an invalid price table at startup (EXP-110)`.
8. **Hard stop.** The user types `/code-review`, then `/security-review`. Nothing continues until
   both have reported.
9. Check each finding against the code and report the evidence. **Hard stop:** the user decides
   which are real. Record the false positives for the Day 10 lesson.
10. Fix only the accepted findings, test first where it applies. Run `pnpm test` and `pnpm typecheck`.
    Commit.
11. **Hard stop.** The user types `/ship-ticket EXP-110`. Fix what fails.
12. Push `fix/exp-110` to `origin` and open a merge request with What, Why, How tested and Notes for
    reviewer. There is no CI, so How tested quotes the output of step 10.
13. Read any comments on the merge request. Merge only when GitLab reports it mergeable. Pull `main`,
    then run `pnpm test` and `pnpm typecheck` again.

## Files to change

- `app/server/src/features/pricing/pricing.ts`, `pricing.test.ts`
- `docs/tickets/EXP-110.md` (new), `docs/tickets/README.md`
- `docs/plans/EXP-110-validate-pricing.md` (this plan)

## How to verify

- `pnpm test`: the new tests fail before step 3 and pass after; all existing tests still pass with no
  assertion changed. `git diff` on the test file shows only added lines.
- `pnpm typecheck` passes for server and web.
- Step 6 shows the real process refusing to start. `git status` afterwards shows `pricing.json`
  unchanged.
- There is no CI on GitLab, so nothing else proves this. A merge request that shows as mergeable says
  nothing about the tests.
