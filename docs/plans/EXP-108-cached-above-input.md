# EXP-108: Cached input tokens above input tokens give a negative cost

## Goal

`POST /api/usage` rejects a record whose `cachedInputTokens` is greater than `inputTokens` with
`400` and a message naming `cachedInputTokens`, and saves nothing. `cachedInputTokens` equal to
`inputTokens` is accepted and costs only the cached rate. Records without `cachedInputTokens` are
still accepted.

Decisions:

- Message: `cachedInputTokens must not exceed inputTokens`.
- The check runs after `inputTokens` and `cachedInputTokens` pass their own integer and
  non-negative checks, so the existing messages and tests are unchanged.
- The fix is in validation only. `calculateCost` stays as is: every record reaches it through
  `parseNewUsageRecord`.
- Out of scope: records with `cachedInputTokens > inputTokens` already in a database.

## Steps

1. Add failing unit tests to `usage.validation.test.ts`:
   - `cachedInputTokens: inputTokens + 1` throws `cachedInputTokens must not exceed inputTokens`;
   - `cachedInputTokens` equal to `inputTokens` is accepted;
   - `cachedInputTokens: null` is accepted (the existing "normalized record" test covers it when
     the field is missing).
2. Add a failing route test to `usage.routes.test.ts`: the ticket's request answers `400` with
   `{ error: 'cachedInputTokens must not exceed inputTokens' }`, and `repository.listAll()` on the
   test repository is still empty.
3. Add a cost test to `cost.test.ts`: `inputTokens` = `cachedInputTokens` = 1,000,000 costs
   exactly the cached rate (`0.5` with the test price). It passes already; it pins the "equal"
   criterion.
4. In `usage.validation.ts`, compare `cachedInputTokens` with the validated `inputTokens` and throw
   when it is greater.
5. Mark EXP-108 `Done` in `docs/tickets/README.md`.
6. Run `pnpm test` and `pnpm typecheck`, then `/ship-ticket EXP-108`.

## Files to change

- `app/server/src/features/usage/usage.validation.ts`
- `app/server/src/features/usage/usage.validation.test.ts`
- `app/server/src/features/usage/usage.routes.test.ts`
- `app/server/src/features/usage/cost.test.ts`
- `docs/tickets/README.md`
- `docs/plans/EXP-108-cached-above-input.md` (this plan)

## How to verify

- `pnpm test`: the new validation and route tests fail before step 4 and pass after; all existing
  tests still pass.
- `pnpm typecheck` passes.
- Manual: with `pnpm dev`, send the ticket's request to `POST /api/usage`; expect `400` and
  `{"error":"cachedInputTokens must not exceed inputTokens"}`, and the 2026-10 total is unchanged.
