# EXP-111: Add a usage record from the dashboard

## Goal

A form on the dashboard adds a usage record through the existing `POST /api/usage` and shows the
API's own error message when the record is rejected.

Decisions:

- The form sets `noValidate` and has no rules of its own, so the rules stay in one place,
  `usage.validation.ts`, and each rejection shows the API's text.
- A number field's text is converted only when it is not empty. `Number('')` is `0`, so a blank
  input field would otherwise pass as a real count. A blank field is sent as `null`. The API accepts
  `null` for `cachedInputTokens` and answers `inputTokens must be an integer` for the others.
- The time uses `datetime-local` and is sent as `new Date(value).toISOString()`, the browser's local
  time as an instant. A blank time is sent as `''`, and the API answers `timestamp is required`.
- The form sits outside the `ready` block of `App.tsx`, so reloading the data does not remove it or
  lose what was typed.
- After a save the page stays on the month on screen. The success message names the record's month,
  so a record for another month does not look lost.
- The record's month comes from the instant in the browser's time zone. The server groups by its own
  `config.timeZone`, so the two can differ near a month boundary when the zones differ. Out of scope.

**Exception to `CLAUDE.md` step 3, approved by the owner on 2026-11-04:** `app/web` has no test
runner and adding one is a new dependency. The failing check is a recorded browser check instead of
an automated test, so this feature has **no regression test** after it merges. The merge request
says so.

Out of scope: edit or delete, checks in the browser, a web test runner, changes to the API.

## Steps

1. Run the app with the preview server `app` and record the failing check in the ticket's Repro:
   the page has no form, so none of the four submits below can run. Do not change code before this.
2. `app/web/src/shared/api.ts`: add `fetchModels()` and `createUsage(input)`. `createUsage` throws
   with the API's `error` text, as `getJson` does.
3. `app/web/src/features/usage/AddUsageForm.tsx`: the form, with props `onAdded`. It loads the models
   on mount and holds its own field, error and success state.
4. `app/web/src/App.tsx`: add a `reloadKey` state to the `useEffect` dependencies, render the form
   under the header, and pass `onAdded` to raise `reloadKey`.
5. `app/web/src/styles.css`: styles for the form, reusing `.panel` and `.error`.
6. Browser pane loop, after each step above that shows on screen: screenshot, console errors, submit,
   fix, repeat. Note each round for the lesson.
7. Add EXP-111 to `docs/tickets/README.md` as `Done`, and fill in the Repro.
8. Run `pnpm test` and `pnpm typecheck` and show the output.
9. Claude in Chrome, then Playwright MCP, run the four submits below. Differences go to the owner.

## Files to change

- `app/web/src/shared/api.ts`
- `app/web/src/features/usage/AddUsageForm.tsx` (new)
- `app/web/src/App.tsx`
- `app/web/src/styles.css`
- `docs/tickets/EXP-111.md` (new)
- `docs/tickets/README.md`
- `docs/plans/EXP-111-add-usage-form.md` (new)

## How to verify

Four submits, on `http://localhost:5173`, at each of the three browsers. Each row also checks the
console for errors.

| Submit | Network | On the page |
|---|---|---|
| Valid: `lyra-flash`, project `demo`, input 1000, cached blank, output 200 | `201` | Success message; totals and table reload; token fields empty |
| `inputTokens` -1 | `400` | `inputTokens must not be negative`; typed values stay; table unchanged |
| Cached 2000, input 1000 | `400` | `cachedInputTokens must not exceed inputTokens`; values stay; table unchanged |
| Empty project | `400` | `project is required`; values stay; table unchanged |

Also: the model list comes from `GET /api/models`; with the API stopped, a submit shows an error and
keeps the typed values.

`pnpm test` and `pnpm typecheck` pass. They do not cover this form. `pnpm seed` afterwards puts the
local database back.
