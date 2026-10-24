# Exercise: explore a feature and verify Claude's claims

## Question

How is the cost of a usage record calculated? Asked in a separate "Day 4 – explore" session in
plan mode, with the explore prompt from the handbook (cite file:line, change nothing, list doubts).

## Claude's summary

Cost is not stored. Every `GET /api/usage` and `GET /api/summary` recomputes it from the record's
token counts and the price table loaded from `pricing.json` at startup, in USD per million tokens.
Cached input tokens are part of `inputTokens` and are billed at the cached rate.

## Verified claims

| # | Claim | Where I read (file:line) | Verdict | Note |
|---|---|---|---|---|
| 1 | Cached tokens are subtracted from input and billed at the cached rate; `null` counts as 0 | `app/server/src/features/usage/cost.ts:10-16`, `usage.ts:9-10` | correct | `cached = record.cachedInputTokens ?? 0` (line 10), `uncached = inputTokens - cached` (line 11); `usage.ts:9` documents cached as part of `inputTokens` |
| 2 | Validation does not reject negative tokens or `cachedInputTokens > inputTokens`, so cost can be negative | `app/server/src/features/usage/usage.validation.ts:5`, `:15-19`, `:35-38`; `app/server/src/shared/db.ts:11-13` | correct | Only `Number.isInteger` is checked; the table has no `CHECK` constraint either. This is EXP-105 |

## What I learned

Both claims held, and the file:line citations made each one a one-minute check. Claim 2 also
found a case EXP-105 does not cover: `cachedInputTokens > inputTokens` makes `uncached` negative
even when every field is non-negative. Raise it as a question when planning EXP-105.
