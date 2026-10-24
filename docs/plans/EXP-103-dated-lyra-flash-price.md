# EXP-103: lyra-flash costs higher than the provider invoice

## Goal

lyra-flash usage from 2026-10-01T00:00:00Z is priced at $0.20 input and $2.00 output per million
tokens; earlier usage keeps $0.30 / $2.50. Other models are unchanged.

Decisions (defaults from the day 2 analysis, to confirm with the Platform team in the MR):

- Effective date: 2026-10-01 at 00:00 UTC. Record timestamps are stored in UTC.
- Cached input price stays at $0.03.
- Design: every model in `pricing.json` becomes a list of price periods. A period without `from`
  applies since the beginning; a period with `from` (ISO 8601 UTC) applies from that instant.
  `getPrice(table, model, timestamp)` returns the last period whose `from` is not after the
  timestamp. One code path for all models.

## Steps

1. Add failing tests:
   - `pricing.test.ts` (new): `getPrice` returns the old price before `from`, the new price at
     exactly `from` and after, a single-period model at any time; unknown model still throws.
   - `pricing.test.ts`: `loadPricing()` with the real `pricing.json` gives lyra-flash
     $0.30 / $2.50 at 2026-09-30T23:59:59Z and $0.20 / $2.00 at 2026-10-01T00:00:00Z, cached $0.03
     both times; orion-large and orion-mini unchanged.
   - `usage.query.test.ts` and `summary.test.ts`: one test each, two lyra-flash records on both
     sides of the change in the same month are priced at their own timestamp.
2. Change `PriceTable` to `Record<string, PricePeriod[]>` and `getPrice` to take the timestamp
   (`pricing.ts`); pass `record.timestamp` in `usage.query.ts` and `summary.ts`.
3. Convert `pricing.json` to the period list and add the lyra-flash period from 2026-10-01.
4. Existing test fixtures: wrap each model's price in a one-element list
   (`{ 'orion-mini': [{ ... }] }`). Only the fixture shape changes; no expected value or
   assertion changes.
5. Run `pnpm test` and `pnpm typecheck`.

## Files to change

- `app/server/src/features/pricing/pricing.ts`, `pricing.test.ts` (new)
- `app/server/data/pricing.json`
- `app/server/src/features/usage/usage.query.ts`, `app/server/src/features/summary/summary.ts`
- Tests: `usage.query.test.ts`, `summary.test.ts` (new tests and fixture shape),
  `summary.routes.test.ts`, `usage.validation.test.ts` (fixture shape only)

## How to verify

- `pnpm test`: the new tests fail before steps 2–3 and pass after; existing tests pass with only
  the fixture shape changed.
- `pnpm typecheck` passes.
- Manual: `pnpm seed`, `pnpm dev`; lyra-flash cost in October is lower than before the change,
  September and other models are unchanged.
