# Exercise: build the project budgets pack in parallel

Day 13 run on this repo, 2026-11-12 to 2026-11-13, by one person playing every role. The input was
the Day 12 pack: [EXP-112](../../tickets/EXP-112.md), [EXP-113](../../tickets/EXP-113.md),
[EXP-114](../../tickets/EXP-114.md), [spec.md](../../capstone/project-budgets/spec.md) and
[test-matrix.md](../../capstone/project-budgets/test-matrix.md).

**Differences from the course:**

- **Sessions started by Claude, not by `claude --worktree`.** The user chose to have the main session
  start one desktop-app session per ticket, each in its own worktree and branch, instead of running
  `claude --worktree` in two terminals. The isolation is the same.
- **Plans approved as written.** The course rule is "Claude-assisted and human-edited". The user
  approved all three plans without editing them; the only human edits of the day were the client's
  answer on the decimals tolerance and the approvals.
- **The developers were Sonnet sessions; the main session reviewed.** The user's standing rule is that
  cheaper models write code and the main session plans, reviews and verifies.
- **Merge order differed from start order.** EXP-112 and EXP-113 started together; EXP-113 merged
  first (!26), then EXP-112 (!27), then EXP-114 (!28).
- The course does not mention `/ship-ticket` or lessons; those follow the repo's conventions.

## Decisions before the build

| Question | Answer |
|---|---|
| Web test runner | Vitest + jsdom + Testing Library, approved as devDependencies of `app/web` |
| How to run in parallel | Claude starts the sessions in the desktop app, each in its own worktree |
| MRs | One per ticket, each with its tests and spec changes, plus this lesson |
| Pre-approved | Commit, push and MR after plan approval and `/ship-ticket`; merge when mergeable with self-run checks; remove old worktrees; `pnpm dev` and `pnpm seed` |

Three old worktrees from Days 8 and 9 and one empty folder were removed first. Their branches were
already on `main`.

## The three sessions

| Ticket | Stream | Started | Plan | Tests added | MR |
|---|---|---|---|---|---|
| EXP-112 API and storage | Server | With EXP-113 | `docs/plans/EXP-112-project-budgets-api.md` | 116 server tests in 5 files; A-01 to A-31 | [!27](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/27), `44e136f` |
| EXP-113 banners | Web | With EXP-112 | `docs/plans/EXP-113-project-budget-banners.md` | 25 web tests in 3 files; B-01 to B-15 except B-11 | [!26](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/26), `a730a48` |
| EXP-114 form | Web | After !26 merged | `docs/plans/EXP-114-project-budgets-form.md` | About 64 web tests; F-01 to F-24 and B-11 | [!28](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/28), `aa2a005` |

Each session started in plan mode, wrote its plan, and waited at `ExitPlanMode`. Each showed its tests
failing before the code: EXP-112 with 5 files failing on missing modules, EXP-113 with 21 of 25 tests
failing on skeletons, EXP-114 with 63 failing.

EXP-112 and EXP-114 merged `origin/main` into their branches before merging (`3ecf72e`, `784cb7b`);
there was no conflict.

## Questions during the build

- **Decimals tolerance (EXP-112, client decision).** The ticket's fixed `1e-9` would reject 131072.02.
  The client chose `max(1e-9, 4 × Number.EPSILON × budgetUsd × 100)`; the ticket rule was updated and
  dated. Five zero-questions rounds had not found it: a reader checks that a rule is clear, a builder
  runs it against numbers.
- **Root `pnpm test` (EXP-113, lead decision).** Changed to `pnpm -r test`; `CLAUDE.md` Commands
  updated to match.
- **Spec.** Only concern 4 changed, from "no automated check for the web part" to the approved runner.
  No requirement text changed.
- **Leftover MINOR questions** were settled in the plans. One user-visible edge stays open on purpose:
  near a month boundary the browser month can differ from the server month, so the form may say
  "Spending shown for <month>." without a month being picked (EXP-114 plan, question 4).

## Approvals in practice

- The auto mode classifier blocked `git commit` and `git push` in all three sessions, and
  `glab mr merge` in EXP-113 and EXP-114, although each brief said they were pre-approved. No session
  worked around it; the user approved in each session ("Cho phép, thử lại", "Cho phép merge",
  "Có, merge").
- The EXP-113 session refused to edit `CLAUDE.md` when the main session asked, because the request came
  from another session. The change was made after the user asked in that session.
- The EXP-114 session's first `git diff` used a `*.env*` pathspec and the block-forbidden hook stopped
  it. It reran the command without that pathspec.

## Checks on `main` after the merges

Run by the main session on `7576bdb`, not taken from the sessions' reports:

- `pnpm test`: server 291 passed (18 files), web 89 passed (7 files). `pnpm typecheck`: clean.
- No existing test file was modified between `86debd7` and `7576bdb`.
- End to end with `pnpm dev`, three usage records this month (`support-bot` $2.40, `code-review`
  $3.50, `docs-search` $1.00):
  - `PUT` a $3 budget for `support-bot`: `200`, `ratio` `0.7999999999999999`, `percent` 80, level
    `warning`. The Day 12 float trap is handled.
  - `PUT` for an unknown project: `404 project not found`. `budgetUsd: 0.001`: `400`.
  - Form: Save $3 for `code-review` shows "Saved", and the exceeded banner (116%) comes before the
    warning banner (80%). Remove on `support-bot` shows "No budget" and its banner goes. No console
    errors.
- `pnpm seed` restored the local database afterwards.

**Not verified:** a real network failure's browser text on Save or Remove (tests pin only the
"Could not save: " prefix); the month-boundary edge above.

## Clean-up

The three sessions were archived and their worktrees removed after the merges. Four screenshots that
EXP-114's browser check had left in the main checkout were deleted.

## For Days 14 and 15

- Day 14 asks for the suite in CI and `/loop` on the build; the repo has no `.gitlab-ci.yml`.
- Day 14's `/code-review` should cover the three merged MRs; EXP-112 adds a database table, so the
  course's "ultrareview if anything touched data" applies.
- Day 15 asks for a tag and a deploy; there is no deploy target.

## Answers to the self-check

1. Both change `App.tsx`. EXP-112 is server-only, so it shares no file with EXP-113.
2. Stop and ask the user in that session. A brief from another session is not the user's approval.
3. The fixed `1e-9` tolerance rejects valid amounts above about $131,072. The plan ran the rule against
   numbers in Node; the zero-questions reader only checked that the rule was clear.
4. That the real endpoint and the page work together, and how they look. One end-to-end run on `main`
   covered the main paths.
5. The client. The developer stops and asks; the BA then updates the ticket or spec.
