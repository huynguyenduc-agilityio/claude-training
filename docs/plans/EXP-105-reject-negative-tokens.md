# EXP-105: API accepts negative token counts

## Goal

`POST /api/usage` rejects `inputTokens`, `outputTokens` or `cachedInputTokens` below zero with
`400` and a message naming the field. Valid records, including zero counts, are still accepted.

Decisions:

- Message: `<field> must not be negative`. The existing `<field> must be an integer` message stays
  for non-integers, so the existing test is unchanged.
- Zero is valid ("below zero" in the acceptance criteria).
- Out of scope: `cachedInputTokens > inputTokens`, which still gives a negative uncached count.
  Noted in the MR as a follow-up.
- Out of scope: negative records already in a database.

## Steps

1. Add failing unit tests to `usage.validation.test.ts`: each of the three fields at `-1` throws
   `<field> must not be negative`; zero counts are accepted.
2. Add a failing route test `usage.routes.test.ts`: the ticket's request to `POST /api/usage`
   answers `400` with `{ error: 'inputTokens must not be negative' }`; follows the in-memory
   server setup of `summary.routes.test.ts`.
3. In `usage.validation.ts`, add a non-negative check after the integer check for the two required
   counts and for `cachedInputTokens` when it is present.
4. Run `pnpm test` and `pnpm typecheck`.

## Files to change

- `app/server/src/features/usage/usage.validation.ts`
- `app/server/src/features/usage/usage.validation.test.ts`
- `app/server/src/features/usage/usage.routes.test.ts` (new)

## How to verify

- `pnpm test`: the new tests fail before step 3 and pass after; all existing tests still pass.
- `pnpm typecheck` passes.
- Manual: with `pnpm dev`, send the ticket's request to `POST /api/usage`; expect `400` and
  `{"error":"inputTokens must not be negative"}`.
