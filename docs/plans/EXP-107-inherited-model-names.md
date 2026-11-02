# EXP-107: Model names like "constructor" are accepted and break the month

## Goal

A model that is not a key of the price table itself (including `constructor`, `toString`,
`hasOwnProperty`, `__proto__`) is rejected by `POST /api/usage` with `400` and
`Unknown model: <name>`, and nothing is saved. `getPrice` throws the same `Unknown model` error for
such a name. Every model in `app/server/data/pricing.json` is still accepted.

Decisions:

- Existing bad rows are out of scope, as they were in EXP-108. The ticket's criteria cover only new
  requests. A row already saved still makes reads answer `500`, now with `Unknown model` instead of
  the `TypeError`; the row must still be deleted by hand.
- One check, one place: `pricing.ts` exports `isKnownModel`, built on `Object.hasOwn`. Both
  `getPrice` and `parseNewUsageRecord` use it, so they cannot drift apart. The other direct lookup
  of a price table by model name is the one in `getPrice` itself; `summary.ts` groups with a `Map`,
  so it does not have this bug.
- `loadPricing` stays as is. A null-prototype table would fix only tables built by `loadPricing`,
  not the plain objects the tests and any other caller pass.
- `getPrice` keeps a plain `Error`, not a `ValidationError`. The criterion asks for the same
  message, and validation is what produces the `400`.
- Tests use the four names the ticket lists. The fix does not depend on which name is used.
- The ticket's `usage.validation.ts:41` is now line 49 after EXP-105, EXP-106 and EXP-108. The
  cause is the same.

## Steps

1. Add failing tests, without changing any existing test:
   - `pricing.test.ts`: `it.each` over the four names; `getPrice` throws `Unknown model: <name>`.
   - `usage.validation.test.ts`: `it.each` over the four names; `parseNewUsageRecord` throws
     `Unknown model: <name>`.
   - `usage.validation.test.ts`: `it.each` over `Object.keys(loadPricing())`; every real model is
     accepted. It passes already; it pins the third criterion.
   - `usage.routes.test.ts`: `it.each` over the four names with the ticket's request; `400`,
     `{ error: 'Unknown model: <name>' }`, and `repository.listAll()` is empty. These go before the
     test that accepts `Number.MAX_SAFE_INTEGER`, because that test saves a row in the shared
     repository.
2. Run the tests and show that the new ones fail for the expected reason.
3. In `pricing.ts`, add `isKnownModel` and use it in `getPrice`. In `usage.validation.ts`, replace
   `!pricing[model]` with `!isKnownModel(pricing, model)`.
4. Mark EXP-107 `Done` in `docs/tickets/README.md`.
5. Run `pnpm test` and `pnpm typecheck`, and show the output.
6. Run `/ship-ticket EXP-107`. Its checks apply; its description goes in a GitHub pull request, not
   a GitLab merge request.
7. Commit: `fix(pricing): reject model names inherited from Object.prototype (EXP-107)`.
8. Push to the `github` remote as `fix/exp-107` and open a pull request against `main` with What,
   Why, How tested and Notes for reviewer.
9. Go through the automatic review's comments one by one. Fix only what is accepted. Merge only on
   the user's word.

## Files to change

- `app/server/src/features/pricing/pricing.ts`
- `app/server/src/features/pricing/pricing.test.ts`
- `app/server/src/features/usage/usage.validation.ts`
- `app/server/src/features/usage/usage.validation.test.ts`
- `app/server/src/features/usage/usage.routes.test.ts`
- `docs/tickets/README.md`
- `docs/plans/EXP-107-inherited-model-names.md` (this plan)

## How to verify

- `pnpm test`: the new `getPrice`, validation and route tests fail before step 3 and pass after; all
  existing tests still pass with no assertion changed.
- `pnpm typecheck` passes.
- The route tests drive the real app over HTTP with an in-memory database, so they cover the ticket's
  repro end to end, and no manual run against `data/usage.db` is needed.
