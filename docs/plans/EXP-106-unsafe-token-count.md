# EXP-106: A token count above the safe integer range breaks every API call

## Goal

`POST /api/usage` rejects `inputTokens`, `outputTokens` or `cachedInputTokens` above
`Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991) with `400` and a message naming the field, and
saves nothing. Counts up to and including `Number.MAX_SAFE_INTEGER` are still accepted and read
back unchanged.

Decisions:

- Message: `<field> must not exceed 9007199254740991`, e.g.
  `inputTokens must not exceed 9007199254740991`.
- The check runs after the existing integer and non-negative checks, so their messages and tests
  are unchanged. A huge negative count still gets `<field> must not be negative`.
- JSON numbers above 2^53 are rounded when parsed (`9007199254740993` arrives as
  `9007199254740992`), but every such value is still above the limit, so the check on the parsed
  number is enough.
- The fix is in validation only. Totals are summed in JavaScript, not in SQL, so reading back
  several records at the limit does not hit the `node:sqlite` `RangeError`.
- Out of scope: unsafe rows already in a database (delete them by hand, as the ticket says).

## Steps

1. Reproduce with Playwright MCP before the fix (Day 8 exercise): in this worktree, `pnpm install`,
   `pnpm seed`, `pnpm dev`; post the ticket's record; open the dashboard for 2026-10 and take a
   screenshot of the failure. Then `pnpm seed` again to remove the bad row.
2. Add failing unit tests to `usage.validation.test.ts`:
   - each of `inputTokens`, `outputTokens`, `cachedInputTokens` set to `9007199254740994` throws
     `<field> must not exceed 9007199254740991`;
   - `inputTokens` and `outputTokens` equal to `Number.MAX_SAFE_INTEGER` (and `cachedInputTokens`
     equal to `inputTokens`) are accepted.
3. Add failing route tests to `usage.routes.test.ts`:
   - the ticket's request answers `400` with
     `{ error: 'inputTokens must not exceed 9007199254740991' }` and `repository.listAll()` is
     still empty;
   - a record with `inputTokens: Number.MAX_SAFE_INTEGER` answers `201`, and `listAll()` returns it
     with the same count.
4. In `usage.validation.ts`, add the limit check to `requireCount` and to the
   `cachedInputTokens` branch.
5. Mark EXP-106 `Done` in `docs/tickets/README.md`.
6. Run `pnpm test` and `pnpm typecheck`.
7. Verify with Playwright MCP after the fix: post the ticket's record (expect `400` naming
   `inputTokens`), then open the dashboard for 2026-10 and take a screenshot showing it still works.
8. `/ship-ticket EXP-106` (run by the user), commit, push to GitLab, open the MR.
9. Day 8 exercise on the GitHub mirror: push `fix/exp-106` to remote `github`, open a PR there;
   through the GitHub connector, read the PR and its diff and post one comment (text shown in chat
   first). The real review and merge stay on GitLab.

## Files to change

- `app/server/src/features/usage/usage.validation.ts`
- `app/server/src/features/usage/usage.validation.test.ts`
- `app/server/src/features/usage/usage.routes.test.ts`
- `docs/tickets/README.md`
- `docs/plans/EXP-106-unsafe-token-count.md` (this plan)

## How to verify

- `pnpm test`: the new tests fail before step 4 and pass after; all existing tests still pass.
- `pnpm typecheck` passes.
- Playwright MCP: before the fix, the dashboard for 2026-10 fails after the bad `POST`; after the
  fix, the same `POST` answers `400` with `inputTokens must not exceed 9007199254740991` and the
  dashboard still shows the month. Screenshots from both runs go in the MR.
