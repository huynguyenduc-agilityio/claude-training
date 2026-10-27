# Exercise: effort levels and ultrathink on the same bug

The same plan-mode prompt, four fresh sessions, one model (`claude-opus-5-5`). The bug is EXP-101
(dashboard cards and usage table disagree), run on a temporary detached worktree at commit
`6040d34`, where the bug still exists and no lesson, plan or failing test reveals the answer.
`97104d2` (just before the fix) was not used: its `docs/lessons/day-02-ticket-analysis/exercise-debug-log.md`
and new test already name the cause.

```bash
git worktree add --detach ../claude-training-exp101 6040d34
```

Prompt (the ultrathink run adds `ultrathink.` at the start):

```text
Here is the bug: docs/tickets/EXP-101.md. Find the root cause.
Cite file:line for every claim, propose the smallest fix and the test that
would prove it. Do not change any file. Work only from the files in this
checkout: do not look at other branches, other commits or git history.
```

## Results

| Run | Score (max 4) | file:line real | Time to answer | Context used | Of which messages |
|---|---|---|---|---|---|
| `low` | 4 | yes | 29 s | 84,294 | 6,839 |
| `medium` | 4 | yes | 43 s | 90,099 | 12,644 |
| `high` | 4 | yes | 57 s | 92,427 | 14,972 |
| `medium` + `ultrathink` | 4 | yes | 112 s | 93,752 | 15,060 |

- Score: 2 for the root cause (`summary.ts:44` filters by the UTC month with `slice(0, 7)`, while
  `usage.query.ts:25` uses `toMonthKey` in `APP_TIMEZONE`), +1 for the smallest fix (pass the
  time zone into `summarizeMonth`), +1 for a test with a record near the month boundary.
- Time: session start to the final answer (`createdAt` to the last activity).
- Context: `get_usage` after the run. About 77,000 tokens are fixed overhead (tools, system prompt,
  skills), so the "messages" column is the part the effort level changes.
- `max` was not run: a session started from another session cannot use a higher effort than its
  parent (`high`). Run it by hand with `/effort max` in a new session.

## What the extra effort bought

- `low`: correct cause, fix and test; also cited where the timestamp is stored as UTC
  (`usage.validation.ts:41`) and the default time zone (`config.ts:18`).
- `medium`: same, plus a note that changing the function signature touches existing test calls,
  which CLAUDE.md says needs approval.
- `high`: same, plus why the existing tests miss the bug (every fixture is mid-month at
  `T04:00:00Z`) and concrete verify steps (`pnpm seed`, compare both endpoints for 2026-09).
- `ultrathink`: same, plus an explicit check that rounding is not the cause and the per-month
  direction of the error (August +3 records on the cards, September -1, October -2). It then
  wrote a plan file and asked to leave plan mode, which the prompt did not ask for; after the
  plan was approved it still changed no file, citing the prompt's "Do not change any file".

## Conclusion

For a bug that is well described and lives in two short files, `low` already finds the correct
cause, fix and test in about a quarter of the time and half the message tokens of the deeper
runs. Higher effort did not change correctness; it added supporting evidence (why tests miss it,
red herrings ruled out, verify steps). Use `low` or `medium` for scoped bugs with a clear repro,
and keep `high`, `ultrathink` or `max` for bugs where the first answer is likely to be wrong or
where the evidence itself is the deliverable. Compare only on one model: the same level name is
calibrated differently per model.

## Which features need which plan

| Feature | Plan or limit |
|---|---|
| Effort levels, `ultrathink` | No plan limit in the docs; Enterprise can cap by role (`maxEffortLevel`). A child session cannot exceed its parent's effort |
| `/loop`, worktrees, subagents | No plan limit; each parallel session or subagent uses quota on its own |
| Remote Control | Pro, Max, Team, Enterprise; not with an API key; Team/Enterprise need an Owner to enable it |
| Cloud sessions | Pro, Max, Team; Enterprise with premium or Chat + Claude Code seats; needs a GitHub repository |
| Artifacts | Pro, Max, Team, Enterprise with a claude.ai login; not with API keys, Bedrock, Vertex or Foundry |
| Dispatch | Limited beta for some Pro/Max accounts |

This account is on Pro. After this exercise the weekly limit was at 89 %: four parallel sessions
plus the two ticket sessions use quota quickly.
