# Exercise: test and harden the project budgets capstone

Day 14 run on this repo, 2026-11-13 to 2026-11-16, by one person playing every role. The input was
the capstone merged on Day 13: EXP-112 (!27), EXP-113 (!26), EXP-114 (!28), lesson !29.

**Differences from the course:**

- **CI on GitHub, not GitLab.** The GitLab project has no runner, so the suite runs on GitHub Actions
  on the mirror. Merge requests stayed on GitLab.
- **Review after merge.** The course reviews before merging; Day 13 merged first. The diff was rebuilt
  as a review-only GitHub PR, and ultrareview needed a temporary clone of the mirror.
- **`/loop` came late.** The four earlier CI runs finished before the user typed `/loop`. The loop was
  set on the run after !32; its first tick already saw green, and it was stopped.
- **Review commands typed in child sessions.** The user asked for child sessions: one ran
  `/code-review high 8` for the user; for ultrareview, Claude only prepared the session and the user
  typed the command, because ultrareview is user-triggered and may bill.
- The course does not mention tickets for findings, `/ship-ticket`, a regression report file or
  lessons; those follow the repo's conventions.

## Decisions before the work

| Question | Answer |
|---|---|
| Where CI runs | GitHub Actions on the mirror |
| How to review merged work | A review-only GitHub PR from `86debd7` to the head of `main` |
| Release notes | `docs/capstone/project-budgets/release-notes.md` plus a private artifact |
| Pre-approved | Commit, push, MR, merge on GitLab; pushes and the review PR on GitHub; tickets for confirmed findings (plans still approved); `pnpm dev` and `pnpm seed` |

## CI

[`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml), MR
[!30](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/30). First run on
the review PR passed in 26 seconds on `ubuntu-latest` (UTC): server 291, web 89, type check clean. It
has run green on every push to `main` since.

## Review

Review-only PR: [#8](https://github.com/huynguyenduc-agilityio/claude-training/pull/8), 46 files,
+3821/−26, base `review/day13-base` (`86debd7`).

| Reviewer | Findings |
|---|---|
| Claude Code Review GitHub action | "No issues found" |
| `/code-review high 8` (child session) | 9: four correctness, one efficiency, one altitude, one reuse, two simplification |
| `/code-review ultra 8` (clone of the mirror) | 4, all `nit` |

Ultrareview first failed in the main checkout: "Reviewing a pull request by number needs a github.com
repository", because `origin` is GitLab. Branch mode would have compared with `main`, which already
held the work. A clone of the mirror ran it; the clone was deleted afterwards.

Each finding was checked against the code and the ticket:

| | Finding | high | ultra | Check | Outcome |
|---|---|---|---|---|---|
| A | Server sorts project names by UTF-16 unit, spec says code point | yes | yes | Node: `1f600` sorted before `ff21` | EXP-115 |
| B | Project `.` or `..` cannot get a budget: the browser shortens the URL | yes | yes | `new URL`: also for `%2E%2E` | EXP-115, client chose to reject the names |
| C | Row state in a plain object breaks for `constructor`, `toString`, `__proto__` | no | yes | Code read: `rows[project] ?? NEW_ROW` returns the inherited function | EXP-115 |
| D | Share products above `2^53` lose precision | yes | no | Node: `299999999 × 99999999 − 299999996 × 100000000` is `0` in numbers, `1` exactly | EXP-115 |
| E | `listAll()` twice per PUT | yes | yes | True, a performance note | Not fixed |
| | Retry after a failed reload; in-memory default repository | yes | no | Both decided in approved plans | Kept |
| | Hard-coded 80%; simplifications | yes | no | Style | Not fixed |

## EXP-115

[EXP-115](../../tickets/EXP-115.md): five scenarios for A to D, built in a worktree session that
started in plan mode. Failing tests first (6 server, 5 web), then server 304 and web 94 passing.
CI ran on the branch through a GitHub PR (#9, closed), then on `main`. GitLab MR
[!31](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/31), fix commit
`fdc841e`.

The session refused the approval to commit when the parent session relayed it, even with the user's
words quoted; the user typed it there. It also stopped a `git diff` with a `.env` pathspec at the
hook and reran without it.

## Regression

[regression-report.md](../../capstone/project-budgets/regression-report.md): on `main` at `f5ce5fc`,
13 manual checks in the built-in browser against the real API, all passing. Among them: September's
totals match `GET /api/summary` (347 requests, $24.84, 83%), the CSV export of October has 223 rows,
the company banner warns at exactly 80%, a project named `constructor` saves its budget, banners show
exceeded (120%) before warning (87%), and budgets survive an API restart.

## Release notes

[release-notes.md](../../capstone/project-budgets/release-notes.md) and the private artifact
https://claude.ai/artifact/XSkmJx6KeeLvd43VWSCa8f, merged with the regression report as
[!32](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/32). CI on
`main` after !32 (`16a40e1`) was green; `/loop` reported it on its first tick.

## For Day 15

- Tag a release and deploy: there is still no deploy target.
- Cross-review: dev reviews QA's tests, QA reviews a dev MR, BA checks merged behaviour against the
  criteria.
- Close review PR #8 and delete `review/day13` and `review/day13-base` on the mirror; unset
  `gh repo set-default`.

## Answers to the self-check

1. The project has no runner; the pipeline would stay pending.
2. Push the commits before and after the work as two branches and open a review-only PR on the
   mirror. Ultrareview reads `origin`, which is GitLab, so it needs a clone whose `origin` is
   github.com.
3. That the suggestion works (the `%2E` idea did not) and whether it changes what users can do; if so,
   the client decides.
4. Only partly. It confirmed the result, but the build had finished; start the loop before pushing.
5. Only the user, typing in that session.
