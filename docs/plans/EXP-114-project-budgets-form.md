# EXP-114: Set and remove project budgets from the dashboard

## Goal

Add a "Project budgets" section to the dashboard (spec R11 to R14): one row per project with usage
records, showing its spending this month and its budget, with a number field, Save and (when a budget
is set) Remove. The API decides what is valid; the form shows the API's error text and keeps what was
typed. After a successful Save or Remove, only `GET /api/project-budgets` reloads, and the banners
(EXP-113) follow it without hiding while it is in flight. Built against the contract in the spec with
`fetch` stubbed; EXP-112 does not need to exist.

## Steps

1. **Setup.** `pnpm install` in the worktree. No new dependency (no `user-event`, no `jest-dom`):
   tests use `fireEvent`, `within`, plain DOM assertions.
2. **Red first.** Add compiling skeletons (`ProjectBudgetsSection` renders `null`, helpers return
   placeholders, `saveProjectBudget`/`deleteProjectBudget` throw "not implemented") so the new tests fail
   on assertions, not on missing imports. Run them and show the red output.
3. **API client** (`app/web/src/shared/api.ts`):
   - `class ApiError extends Error { status: number }`. `readJson` throws it with the same message as
     today (`body.error ?? "Request failed: <status>"`), so every existing caller and test behaves the
     same. A failed `fetch` (no response) stays a plain `Error`/`TypeError`.
   - `saveProjectBudget(project, budgetUsd: number | null)`: `PUT /api/project-budgets/<encodeURIComponent>`
     with `{"budgetUsd": ...}` (`null` is sent as `null`). Uses `readJson`.
   - `deleteProjectBudget(project)`: `DELETE` same path. `204` has no body, so it does not call
     `response.json()`; a non-ok answer throws the same `ApiError`.
4. **Pure helpers** (`app/web/src/features/budget/budgetForm.ts`):
   - `toBudgetAmount(text)`: blank or whitespace to `null`, else `Number(text)` (as `toCount` in the add
     form; never `0` for empty). No rules of its own.
   - `failureMessage(error, verb: 'save' | 'remove')`: `ApiError` with status below 500 returns the error
     text alone; otherwise (no response, or 5xx) `"Could not <verb>: <text>"`.
5. **Hook** (`useProjectBudgets.ts`): same effect on `[reloadKey]`, still sets the banner state to
   `loading` on every full reload (B-12, B-15 keep passing). New:
   - returns `{ banners, section, refresh }`. `banners` is today's `ProjectBudgetsState`.
   - `section` is `{status:'loading'} | {status:'error'} | {status:'ready'; month; projects}`. It starts
     `loading`; a reload does **not** reset it, so rows keep what they showed until the response; a
     response sets `ready`; a failure sets `error` (same as a failed first load).
   - `refresh()` fetches again **without** setting `banners` to `loading` (B-11: old banners stay), applies
     the response to both `banners` and `section` if no newer load started, and resolves with the fetched
     `ProjectBudgets` or `null` on failure. A request counter ref replaces the `cancelled` flag so stale
     responses are ignored; unmount also cancels.
6. **Section** (`ProjectBudgetsSection.tsx`, new; props `section`, `month` = the picked month, `refresh`):
   - Always mounted, right after `<AddUsageForm/>` and before the loading/error/banners/totals block, so
     it stays while the month reloads and keeps its row state (F-21).
   - `<section className="panel"><h2>Project budgets</h2>` then, by state: `loading` gives
     "Loading project budgets…" (`<p className="muted">`); `error` gives "Project budgets are
     unavailable." (`<p className="error">`, no `role`); `ready` with no projects gives "No projects have
     usage records yet."; `ready` with projects gives, when `month !== section.month` and the list is not
     empty, `Spending shown for <section.month>.` (`<p className="muted">`, between the heading and the
     rows), then the rows in the API's order.
   - Row = `<form noValidate aria-label={project}>`, so Enter in the field is Save. Content: project name,
     `Spent this month: <formatUsd(spent)>` (no percent), `<input type="number" step="any"
     aria-label="Budget for <project>">` (no `min`, no browser validation), next to it `formatUsd(budget)`
     or "No budget", Save (`type="submit"`), Remove (`type="button"`, only when `budget !== null`), the
     row message.
   - Row state in a `Record<project, { text?: string; message?; pending; rev }>` held by the section:
     field value = `text ?? String(budget ?? '')` (`15`, `7.5`, empty). It survives reloads and a failed
     reload.
   - Save: `pending` on (Save and Remove disabled, F-18), send `toBudgetAmount(text)`. On 2xx: message
     "Saved", `pending` off, `await refresh()`; when the reload answers, the row (if not edited since)
     drops its typed `text` and shows the API value (`15` for `15.0`); other rows are untouched (F-17).
     On failure: `failureMessage(error, 'save')`, text kept, no reload.
   - Remove: same, success clears the message (no message, Scenario 4), failure shows
     `failureMessage(error, 'remove')`, the budget stays.
   - Editing the field clears that row's message and bumps `rev` (F-20). Save always sends, even if the
     value did not change (F-19).
7. **`App.tsx`**: `const budgets = useProjectBudgets(reloadKey)`; `<ProjectBudgetBanners state={budgets.banners}/>`;
   `<ProjectBudgetsSection section={budgets.section} month={month} refresh={budgets.refresh}/>` after
   `<AddUsageForm/>`. Nothing else changes.
8. **Test helper** (`app/web/src/test/fakeApi.ts`): additive only. New optional `mutation` handler in
   `FakeApiOptions` for `PUT`/`DELETE` on `/api/project-budgets/...` (today every URL starting with
   `/api/project-budgets` would consume a GET handler). No existing option, return value or call changes.
9. **Docs**: save this plan as `docs/plans/EXP-114-project-budgets-form.md`; mark EXP-114 `Done` in
   `docs/tickets/README.md`; ticket "Repro" paragraph (no longer "no test runner"). `spec.md` and the
   ticket criteria do not change unless a question below is answered differently (see "Questions").
10. **Check** `pnpm test`, `pnpm typecheck`; browser check (How to verify). Then stop and ask the user to
    type `/ship-ticket EXP-114`; only then commit, push, open the MR.

## Tests: which matrix rows are automated

All 24 F rows and B-11 are automated, stubbed `fetch`, colocated `*.test.ts(x)`, no existing test touched.
Expected: about 45 new web tests in 5 files.

| File | Rows |
|---|---|
| `shared/api.test.ts` | `readJson` keeps its messages; `ApiError.status` for 4xx and 5xx; PUT URL with an encoded name (`search, v2`), body `{budgetUsd: 15}` and `{budgetUsd: null}`; DELETE accepts `204` with no body |
| `features/budget/budgetForm.test.ts` | F-07 input side (`abc` is `''`, sent as `null`); F-06 empty is `null`, `0` stays `0`, `-5`, `10.005` unchanged; F-08/F-09/F-10/F-11 message rules (no response, 5xx, 4xx with and without `error`) |
| `features/budget/ProjectBudgetsSection.test.tsx` | F-01 rows in API order, `10` and "$10.00", others empty and "No budget"; F-05 no Remove; F-12 sentence on a picked past month; F-13 no sentence on the current month; F-14 empty list text; F-15 unavailable text; F-16 loading text; F-22 no new-name field (only the budget inputs); F-24 empty list on a past month, no sentence; F-02 type 15, Save: "Saved", `15` and "$15.00" after the reload; F-03 7.5; F-04 Remove: "No budget", empty field, no message; F-06 four error rows (`0`, `-5`, `10.005`, empty) with the API text alone, typed text kept, `refresh` not called; F-07 `abc` sent as `null`; F-08, F-09 no response; F-10 500 gives "Could not save: Internal server error"; F-11 404 without `error` gives "Request failed: 404" alone; F-17 row B keeps typed text and message when row A is saved; F-18 buttons disabled while pending; F-19 Save of the same value is sent and shows "Saved"; F-20 editing clears the message; edit during a pending request keeps the new typed text |
| `App.test.tsx` (new `describe`; existing tests untouched) | section sits after the Add record form and before the banners; F-02/F-04 only `GET /api/project-budgets` is fetched again (no summary/usage refetch); **B-11** old banners stay until the slow reload answers, then change; F-21 typed text kept after adding a usage record; F-23 company banner unchanged after Save; budgets failure gives "Project budgets are unavailable." and the error line, page still loads; F-12 end to end with the month input |
| `features/budget/useProjectBudgets.test.tsx` | `refresh` does not set `banners` to `loading`; a full reload still does; `section` keeps rows during a reload and goes to `error` on a failed one; stale response ignored |

**Stays manual (browser check only):** the look (layout, wrap, spacing, colours), since jsdom has no
layout. F-08/F-09 in a real browser also show a real network error text; tests only fix the prefix, as the
matrix says.

## Questions: MINOR items from zero-questions round 5 that touch EXP-114

| # | Settled how |
|---|---|
| 1 Where "Spending shown for …" sits; heading with the error texts | Heading "Project budgets" is always shown. The sentence goes between the heading and the rows. Loading, unavailable and empty texts sit under the heading, as above. |
| 2 Money format of spending; percent on the row | `formatUsd` (2 decimals); no percent on the row. |
| 3 Enter, `step`, `min` | One form per row, so Enter in the field is Save. `type="number"`, `step="any"`, no `min`, `noValidate`. |
| 4 Browser `thisMonth()` against the server time zone near a month boundary | Not fixed. The section compares the picked month with the API `month`; at a boundary it may show "Spending shown for <month>." although the user did not pick another month. Known edge, raise with the client if it shows. |
| 6 Editing a field while its request is pending | The field stays editable (only the buttons are disabled, as the ticket says). A response applies its message and its API-value reset only if the row was not edited since the request started (`rev` check); the typed text always wins. The reload still runs. |
| 7 Save succeeds but the reload fails | "Saved" stays on the row, but the section then reads "Project budgets are unavailable." and the banner area shows the error line (a failed reload is a failed first load). Typed text stays in the section's state and shows again after the next successful load. |

Not in the ticket, decided here (no user-visible effect worth the client's time): the row message for an
error uses `role="alert"` as the add form does; "Saved" is a plain `.success` span. If you see a user
visible gap while building, I stop and ask before deciding it.

I found no question that the ticket and spec leave open and that changes what a user sees, so I plan no
change to the ticket or `spec.md` except the ticket's Repro paragraph.

## Files to change

- `app/web/src/shared/api.ts`, `shared/api.test.ts` (new)
- `app/web/src/features/budget/budgetForm.ts`, `ProjectBudgetsSection.tsx`, `useProjectBudgets.ts` (new
  and changed) and their tests
- `app/web/src/App.tsx`, `App.test.tsx` (new `describe` only)
- `app/web/src/test/fakeApi.ts` (additive option)
- `app/web/src/styles.css` (a few `.budget-*` classes for the row layout)
- `docs/plans/EXP-114-project-budgets-form.md`, `docs/tickets/README.md`, `docs/tickets/EXP-114.md`
  (Repro paragraph)

Reused: `formatUsd`, `getJson`/`readJson`, `.panel`, `.muted`, `.error`, `.success`, `.form-actions`,
`stubApi`, `budgetEntry`, `json`, `summaryFor`.

## How to verify

1. Red: show the new tests failing on the skeletons; green after the code.
2. `pnpm test` and `pnpm typecheck` pass; report test counts for server and web. No existing assertion
   changed (`git diff` shows additions only in existing test files).
3. Browser check, only if ports 4000 and 5173 are free: `pnpm dev`; EXP-112 may not be merged, so route
   `/api/project-budgets` (GET, PUT, DELETE) in the browser (Playwright MCP) to check the layout, a
   successful Save and Remove, an API 400, an unreachable API and the banners staying during a slow reload.
   Not checked if EXP-112 is not merged: the real endpoint end to end, and the real network error text.
