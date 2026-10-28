# Exercise: one team skill and one personal command

Day 7 asks for one team skill and one personal slash command, with the team skill shipped through
a merge request into `.claude/`.

| Item | Where | Evidence | Result |
|---|---|---|---|
| Team skill `ship-ticket` | [`.claude/skills/ship-ticket/SKILL.md`](../../../.claude/skills/ship-ticket/SKILL.md) | 49 lines; `claude plugin validate .claude/skills` passed; merged in [MR !10](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/10) | Pass |
| Auto-invocation | Same session | "Branch này đã ready for a merge request chưa?" invoked the skill without `/` | Pass |
| Manual invocation | `/ship-ticket`, `/ship-ticket EXP-108` | Both ran checks 0 to 7 and drafted the MR description; nothing was committed or edited | Pass |
| Personal command `/dojo-day` | `~/.claude/skills/dojo-day/SKILL.md` | 45 lines, `disable-model-invocation: true`; `/dojo-day 07` fetched the day page, summarized the Developer track and stopped | Pass |

## Design choices

- `ship-ticket` is the repo's version of a release checklist: the standing checks from CLAUDE.md
  and `docs/tickets/README.md` (tests, typecheck, plan vs. diff, no weakened assertions,
  Conventional Commits with the ticket id, no AI attribution, backlog row, no `.env` or
  dependency changes), each reported PASS, FAIL or N/A with evidence.
- `allowed-tools` pre-approves only read-only commands (`git status`, `git diff`, `git log`,
  `git branch`, `pnpm test`, `pnpm typecheck`), so a run asks no questions and still cannot push.
- Changed after the first draft: a FAIL no longer stops the run, so the table always has every
  row.
- `/dojo-day` is personal (it writes to my handbook) and user-invoked only.

## What I would do differently

- Make `ship-ticket` also check `git diff main`, so it is useful before the first commit; on
  EXP-108 it marked checks 2, 3 and 6 FAIL only because nothing was committed yet.
- Say in the skill what to do when `$ARGUMENTS` is empty instead of relying on inference.
