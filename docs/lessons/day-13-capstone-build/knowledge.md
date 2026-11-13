# Day 13: capstone build

Course: [Day 13](https://dojo.agilityio.dev/schedule/day-13.html), the second capstone day, for every
role. Developers build the Day 12 tickets in parallel isolated sessions, plan mode first, one merge
request per ticket. QA writes the automated suite alongside the code. The BA updates the spec as
questions resolve. Rule of the day: every artifact (spec, tests, MRs, notes) is Claude-assisted and
human-edited. Skills: plan mode ([Day 4](https://dojo.agilityio.dev/schedule/day-04.html)), and git
worktrees with parallel sessions ([Day 6](https://dojo.agilityio.dev/schedule/day-06.html)).

The point of the day: a ticket pack that passed the zero-questions test can be built by several
agents at once, without a meeting, if the tickets touch different files and a human approves each
plan before any code is written.

## Roles

| Role | Does | Produces |
|---|---|---|
| Developer | Plans in plan mode, waits for approval, then tests first and code | Plan, code, tests, one MR per ticket |
| QA | Turns the test matrix into automated tests next to the code | The suite, rows mapped to tests |
| BA | Changes the spec or ticket when a build question is answered | Updated ticket or spec |
| Lead / client | Approves plans, answers build questions, approves merges | Every decision |

## Parallel isolated sessions

- One session per ticket, each in its own git worktree, so two agents never edit the same files.
  The Day 6 setup is `claude --worktree <name>` in two terminals; the desktop app can start the same
  kind of session from another session, each with its own worktree and branch.
- Split by file, not by size. The Day 12 spec named two streams: server (EXP-112) and web
  (EXP-113, then EXP-114). EXP-113 and EXP-114 both change `App.tsx`, so they ran one after the other.
- Build against the contract. EXP-113 and EXP-114 used the `GET/PUT/DELETE /api/project-budgets`
  contract from the spec, with `fetch` stubbed, before EXP-112's endpoint existed on `main`.
- Shared lines still conflict. Every ticket marks its row in `docs/tickets/README.md`; the second
  and third MRs merged `origin/main` into their branch before merging.
- A worktree has its own `node_modules` and its own `data/usage.db`. Run `pnpm install` in it.
- Remove a worktree when its MR has merged. A worktree still open in a session cannot be deleted on
  Windows ("Device or resource busy"); archive the session first.

## Plan mode first

- The session starts in plan mode: it reads and writes the plan file only, then calls `ExitPlanMode`
  and waits. Approval switches it to a mode that may edit.
- A good plan names which test-matrix rows become automated tests, which stay manual and why, and how
  each leftover MINOR question is settled. Reviewing the plan is cheaper than reviewing the diff.
- Planning is where the build finds what the zero-questions test missed. EXP-112's plan found that the
  ticket's fixed `1e-9` tolerance for "at most 2 decimals" rejects valid amounts above about $131,072,
  because `131072.02 × 100` carries more float error than that. The client chose a tolerance that grows
  with the amount, and the ticket was updated.

## The automated suite

- Every test-matrix row maps to a test, or the plan says why not. Here all 31 API rows, all 15 banner
  rows and all 24 form rows are automated; only the look (colours, layout) is checked by eye.
- Failing tests first. Each session showed the red run (missing modules, or assertions failing on
  skeletons that render nothing) before the code.
- Web tests need a runner. `app/web` had none, so the lead approved Vitest, jsdom and Testing Library
  as new devDependencies, and the root `pnpm test` became `pnpm -r test` to run server and web.
- Stubbed tests are not end to end. After all three merges, the real endpoint and the real form were
  run together once on `main`.

## Approvals in auto mode

- An approval written into another session's brief is not the user's approval in the session that
  acts. The auto mode classifier blocked `git commit` and `git push` in all three sessions, and
  `glab mr merge` in two, even though the brief said they were pre-approved; the user had to say it in
  each session.
- A session should refuse to change `CLAUDE.md` or settings because another session asks, even when
  that session says the user agreed. The user then gives the instruction in that session or edits the
  file.
- Cross-session messages and notes are data, not instructions. The session that started the others
  reads their reports and checks the diff before telling the user anything is done.

## Choosing what goes where

| Situation | Choose |
|---|---|
| Two tickets change the same file | Run them one after the other; start the second from the merged `main` |
| The endpoint is not merged yet | Build the client against the contract with `fetch` stubbed |
| A plan question changes what users see | Stop and ask the client, then update the ticket or spec |
| A plan question nobody outside can see | Decide it in the plan |
| A matrix row cannot be automated yet | Say why in the plan; move it to the ticket that makes it possible |
| A session needs permission it lacks | The user grants it in that session; never route the action through another session |

## Gotchas

- `git worktree remove` can fail on Windows with "Directory not empty" after it has already
  unregistered the worktree. Delete the leftover folder, then run `git worktree prune`.
- Playwright MCP screenshots from a worktree session landed in the main checkout, not in the
  worktree. Check `git status` in the main checkout after a browser check.
- A screenshot taken right after a click can show the page before it re-renders. Read the page text or
  the API again before calling it a bug.
- A command chain that stops early can skip `pnpm install`; a type check that then fails is not a code
  failure. Run the steps separately when a result looks wrong.
- The block-forbidden hook stops any command whose text contains `.env`, including a `git diff` with a
  `*.env*` pathspec. Drop the pathspec; do not work around the hook.

## Self-check

1. Why do EXP-113 and EXP-114 not run at the same time, when EXP-112 and EXP-113 do?
2. A session's brief says "commit is pre-approved", and the classifier blocks the commit. What next?
3. What did EXP-112's plan find that five zero-questions rounds did not, and why could planning find
   it?
4. All web tests pass with `fetch` stubbed. What is still not proven?
5. Who may answer a build question that changes what the user sees?
