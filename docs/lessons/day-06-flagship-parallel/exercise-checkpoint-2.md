# Exercise: Checkpoint 2 (Developer track)

Day 6 exercise: one artifact, one loop run and one phone steer. Checkpoint 2 adds two parallel
sessions that both merge and one plan-mode change steered through diff comments.

| Criterion | Evidence | Result |
|---|---|---|
| Two parallel sessions, both merged | EXP-104 in worktree `exp-104-csv-export`, [MR !6](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/6), merge `38542b5`. EXP-102 in worktree `exp-102-budget-alert`, rebased after !6 with no conflicts, [MR !7](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/7), merge `26c76dd` | Pass |
| One plan-mode change steered via diff comments | EXP-102: plan approved, then four comments on the diff pane (webhook timeout, one scan per insert, notify at 100%, server decides the current month), sent together and applied in one round; 66 tests on the branch, 84 after the rebase | Pass |
| One artifact | Walkthrough of MR !6: annotated diff, findings by severity, test evidence | Pass |
| One Remote Control steer | From the phone, the EXP-102 session was asked to commit, push and open the MR; it did, rebasing onto `main` first | Pass |
| One `/loop` run | `/loop 5m check the deploy` on `GET /api/health`: `ok`, then connection refused after stopping `pnpm dev`. `/loop 15m` on MR !6: mergeable, no comments, tests green. Both cancelled with `CronDelete` | Pass |

Extra parts of the day:

- **Cloud session:** test coverage audit on the GitHub mirror, laptop closed, checked and steered
  from the phone; report in [cloud-coverage-audit.md](cloud-coverage-audit.md).
- **Effort comparison:** [exercise-effort.md](exercise-effort.md).
- **Subagent review:** the EXP-104 diff was reviewed by a subagent before the MR; it approved
  with minor suggestions only.

## What I would do differently

- Push the latest `main` to the GitHub mirror right before a cloud session; the audit ran on
  `c0257f9`, two merges behind.
- Start the cloud task first thing: it runs in the background while the local work goes on.
- Run parallel sessions with an eye on the plan's weekly limit.
