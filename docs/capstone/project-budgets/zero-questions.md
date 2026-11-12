# Zero-questions test: project budgets

The developer is a fresh agent with no chat context. It reads the three tickets, the spec and the
code, and must not read `brief.md` or `intake.md`. It lists every question it would have to ask
before starting, marked BLOCKING (two reasonable developers would build something a user or API
caller can tell apart) or MINOR. The pack passes when a round has no BLOCKING question.

Limit: the agent is the same kind of model as the BA drafter, so it may share blind spots. Day 13,
when the tickets are built, is the stronger test.

## Score

| Round | Date | BLOCKING | MINOR | Result |
|---|---|---|---|---|
| 1 | 2026-11-11, before 17:10 | 6 | 6 | Not done |
| 2 | 2026-11-11, 17:12 | 5 | 7 | Not done |
| 3 | 2026-11-11, 17:32 | 3 | 7 | Not done |
| 4 | 2026-11-11 | 1 | 13 | Not done |
| 5 | 2026-11-11, recorded 22:50 | 0 | 9 | **Passed** |

Elapsed time from the brief (15:42) to the last round that still had a BLOCKING question
(round 3, 17:32) was 110 minutes. Rounds 4 and 5 ran after a break, so the total wall-clock time
is not the BA's working time. The 90-minute skill bar was missed.

Round 3 counted internal choices (names, layout, schema) as out of scope, unlike rounds 1 and 2. Its
own tally said 2 BLOCKING, but it marked three questions BLOCKING (1, 2, 4); the table counts three.
Checked against the code on 2026-11-11: `express.json()` answers 500 for the bodies `null` and `5`,
accepts `[]`, and leaves the body `undefined` with no body; `1e-12 × 100` is within `1e-9` of 0, so
the decimals rule lets an amount of 0 cents through.

Round 2 used a new agent. Its questions go one level deeper than round 1: float arithmetic at the
boundaries, error precedence, sort order, and what the existing code does with a malformed body
(`express.json()` fails before the route, and `handleErrors` maps that to 500).

## Round 1

| # | Ticket | Question, short | Kind | Decision (client or lead, 2026-11-11) |
|---|---|---|---|---|
| 1 | EXP-112 | Is `ratio` rounded? Float noise changes the floored percent | BLOCKING | Lead: `ratio` stays exact; the API adds `percent`, rounded down on the server |
| 2 | EXP-112 | Unknown project with an invalid body: 404 or 400? | BLOCKING | Lead: project first, 404 |
| 3 | EXP-114 | Field shows "$15.00", so the next Save sends text | BLOCKING | Client: a number field shows `15`; `$15.00` shows next to it |
| 4 | EXP-113, EXP-114 | A full reload unmounts the section and loses "Saved" | BLOCKING | Lead: a budget change reloads only `/api/project-budgets`; the section stays mounted |
| 5 | EXP-113 | Order by exact ratio or by the shown percent? | BLOCKING | Lead: exact ratio, then name |
| 6 | EXP-113, EXP-114 | What shows when the budgets cannot load? | BLOCKING | Client: one error line where the banners go; the section reads "Project budgets are unavailable." |
| 7 | EXP-114 | A failed Remove | MINOR | Client: "Could not remove: " plus the error |
| 8 | EXP-114 | How long a row's message stays | MINOR | Client: until the field is edited or Save or Remove is pressed again |
| 9 | EXP-114 | Wording of "spending is for the current month" | MINOR | Client: "Spending shown for 2026-11." |
| 10 | EXP-113 | Banners relative to the unpriced banner; "at the top" contradicts `App.tsx` | MINOR | Client: below the company banner, above the unpriced banner |
| 11 | EXP-112 | Bad JSON, extra fields, huge amounts | MINOR | Client: at most 1000000; extra fields ignored; bad JSON unchanged from today |
| 12 | EXP-114 | No projects at all | MINOR | Client: "No projects have usage records yet." |

## Round 2

All decisions by the client and lead, 2026-11-11.

| # | Ticket | Question, short | Kind | Decision |
|---|---|---|---|---|
| 1 | EXP-112 | Float error at boundaries ($2.40 of $3.00) | BLOCKING | Lead: `percent` and `level` in whole cents; `ratio` for information |
| 2 | EXP-112 | Which error wins; how to test "2 decimals" | BLOCKING | Lead: finite number, > 0, ≤ 1000000, 2 decimals (within `1e-9`), in that order |
| 3 | all | Sort order of names | BLOCKING | Client: code-point order, uppercase first |
| 4 | EXP-112 | Malformed body runs into `express.json()` and 500 | BLOCKING | Lead: keep 500 for bad JSON; `[]`, `null`, a number or no body is "must be a number" |
| 5 | EXP-113, EXP-114 | Load error on past months; while loading | BLOCKING | Lead and client: separate fetch; error line on the current month only; "Loading project budgets…" in the section |
| 6 | EXP-113, EXP-114 | Which "current month" | MINOR | Lead: `summary.isCurrentMonth` for banners; API `month` in the section |
| 7 | EXP-114 | Message after Remove | MINOR | Client: none; the row shows "No budget" |
| 8 | EXP-114 | Typed "abc" | MINOR | Client: empty, sent as `null` |
| 9 | EXP-114 | Pending requests, unchanged Save | MINOR | Client: buttons disabled while pending; Save always sends |
| 10 | EXP-114 | 5xx text | MINOR | Client: 4xx shows the API text; 5xx or no response gets the prefix |
| 11 | EXP-112 | Malformed `:project` | MINOR | Lead: no special handling; any 4xx or 5xx |
| 12 | all | Placement wording, "any month", spec status | MINOR | Fixed in the pack |
| 13 | all | Hard to test | MINOR | Lead: temp-folder database for scenario 10; scenario 7 of EXP-113 reworded |

## Round 3

All decisions by the client and lead, 2026-11-11.

| # | Ticket | Question, short | Kind | Decision |
|---|---|---|---|---|
| 1 | EXP-112 | Bodies `null`, `5`, `[]`, none, against strict `express.json()` | BLOCKING | Lead: `null` and a number answer 500 like bad JSON; `[]` or no body is "must be a number" |
| 2 | EXP-112 | 1e-12 passes every rule and becomes 0 cents | BLOCKING | Lead: the amount must round to at least 1 cent |
| 4 | EXP-114 | Other rows after a reload; the saved row's shown value | BLOCKING | Client: other rows keep typed text and messages; the saved row shows the API value |
| 3 | EXP-112 | `spent` for projects with no priced records this month | MINOR | Lead: 0; `ok` with a budget, `none` without |
| 5 | EXP-114 | A 4xx without `error` | MINOR | Client: the existing fallback text alone, for example `Request failed: 404` |
| 6 | EXP-114 | What "another month" means | MINOR | Lead: picked month differs from the API `month` |
| 7 | EXP-113, EXP-114 | What shows during a reload | MINOR | Client: keep the old data; a failed reload is like a failed first load |
| 8 | EXP-113 | Error line while the summary is not ready | MINOR | Lead: only when the summary has loaded and it is the current month |
| 9 | EXP-113 | Scope wording contradicts the fetch rule | MINOR | Fixed |
| 10 | spec | "never computes" against the cents ordering | MINOR | Fixed in the spec wording |

## Round 4

All decisions by the client and lead, 2026-11-11.

| # | Ticket | Question, short | Kind | Decision |
|---|---|---|---|---|
| 1 | EXP-113 | Banners during the month's reload, against `App.tsx` showing "Loading…" | BLOCKING | Client: as today, the banners go with the rest; they stay only when the budgets alone reload |
| 2 | EXP-112 | Is a budget stored raw or rounded? | MINOR | Lead: rounded to cents |
| 3 | EXP-112 | A `month` parameter | MINOR | Lead: ignored |
| 4 | EXP-112 | No projects at all | MINOR | Lead: 200 with `projects` empty |
| 7 | EXP-114 | "Spending shown for" with an empty list | MINOR | Lead: not shown |
| 14 | spec | Which wins, spec or ticket | MINOR | Lead: neither; a disagreement is a bug in the pack, ask the BA |
| 5, 6, 8–13 | all | Concurrent edits, labels, exact error text, exact amounts in a browser, test runner, seed test, optional dependency in `createApp` | MINOR | Lead: left to the Day 13 plans; they do not change what a user or caller sees |

## Round 5: no BLOCKING question

The pack passes under the rule set on 2026-11-11: zero BLOCKING questions; MINOR questions go to
the Day 13 plans. The nine MINOR questions, for those plans:

| # | Ticket | Question, short | Where it is decided |
|---|---|---|---|
| 1 | EXP-114 | Where "Spending shown for …" sits; heading with the error texts | EXP-114 plan |
| 2 | EXP-114 | Money format of a row's spending; percent on the row | EXP-114 plan (`formatUsd`, no percent) |
| 3 | EXP-114 | Enter key, `step` and `min` on the number field | EXP-114 plan: no browser validation, so no `min` and `step="any"` |
| 4 | EXP-113, EXP-114 | Browser month (`thisMonth()`) against the server's time zone near a month boundary | EXP-114 plan; a known edge, raise with the client if it shows |
| 5 | EXP-112 | `ratio` from dollars or cents | Spec: `spent / budget` |
| 6 | EXP-114 | Editing a field while its request is pending | EXP-114 plan |
| 7 | EXP-114 | Save succeeds but the reload fails | Covered by "a failed reload is handled like a failed first load" |
| 8 | EXP-112 | Is "at most 1000000" checked raw or rounded? | EXP-112 says raw, in that order |
| 9 | EXP-113 | `role="alert"` and the error line's CSS class | EXP-113 plan: same as the existing banner and error line |

Notes from round 5 for the developers: `seed.ts` must also clear the budgets (R6), and `readJson` in
`app/web/src/shared/api.ts` must expose the HTTP status for the 4xx and 5xx messages.

Not turned into tests as written, and how the pack now handles it:

- Exact amounts such as 7.99 cannot come from real token prices. EXP-112 now says tests may insert
  chosen records or test the status function on its own.
- `app/web` has no test runner, so EXP-113 and EXP-114 are browser checks (spec concern 4).
- A network error's text depends on the browser, so only the prefix can be checked.
