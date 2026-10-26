# Exercise: prove that context matters

The same planning task in two sessions, both in plan mode, no repo files changed.

- **Session A (with context):** first asked to read `app/server/src` and explain how a usage record
  goes from `POST /api/usage` to the dashboard, citing file:line. Then the task.
- **Session B (fresh):** the task only.
- **Task (identical in both):** read `docs/tickets/EXP-104.md` (export a month of usage records to
  CSV) and plan the change: files to change with file:line, tests to add, questions for the
  reporter, risks.

Token numbers come from the session context breakdown (the same data `/context` shows). A fresh
session starts at about 78,000 tokens of fixed content (system tools, MCP tools, system prompt,
skills); only the Messages category grows with the work.

## Results

| Criterion | Session A (with context) | Session B (fresh) |
|---|---|---|
| Tokens for the task itself (Messages after minus before) | 15,078 (22,381 to 37,459) | about 18,300 (0 to 18,328) |
| Total context after the task | 115,426 | 97,532 |
| Files to change correct, file:line real | Yes; spot-checked `api.ts:52-53`, `RecordsTable.tsx:6`, `usage.routes.ts:27-30`, `vite.config.ts:8-10` | Yes; spot-checked `usage.query.ts:11-15`, `usage.routes.ts:16-22`, `:27-30` |
| Questions for the reporter hit the real ambiguities | 6: time zone of the time column, cost precision vs the cent-rounded total, null cached tokens, BOM and separator, header text, formula neutralising | 6: the same topics |

Both plans chose the same design (server builds the CSV from `listMonth`, so rows and total cannot
drift from the table; the web app has no test runner) and listed the same risks (cent drift,
time zone, CSV injection). A was slightly more precise in places: exact citations for the web
proxy and the ticket lines, `toFixed(8)` with a reason, and the route-order check.

## Conclusion

In this small repo the warm-up saved only about 18% of the task's tokens, and A carries 18,000
more tokens of context into every later message. Context paid off less than expected because a
fresh session already has `CLAUDE.md` and auto memory, and the codebase is small enough to read
in one go. Continue in a session that already has context when the next task is in the same area;
open a fresh session when the topic changes, because the old context costs tokens on every message
and can mislead.
