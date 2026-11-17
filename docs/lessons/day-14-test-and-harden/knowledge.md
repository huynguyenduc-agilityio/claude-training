# Day 14: capstone test and harden

Course: [Day 14](https://dojo.agilityio.dev/schedule/day-14.html), the third capstone day, for every
role. QA runs the regression and puts the automated suite in CI, with `/loop` babysitting the build.
Developers run `/code-review`, escalate to ultrareview if anything touched auth or data, and fix the
findings. The BA drafts client-facing release notes as an artifact. Skills: `/loop`
([Day 6](https://dojo.agilityio.dev/schedule/day-06.html)), `/code-review` and ultrareview, and
release notes from merged PRs ([Day 10](https://dojo.agilityio.dev/schedule/day-10.html)).

The point of the day: a feature that passed its own tests is not done until the whole app has been
checked again, a second pair of eyes has reviewed it, and the client can read what changed.

## Roles

| Role | Does | Produces |
|---|---|---|
| QA | Reruns the suite in CI and the existing features by hand | CI workflow, regression report |
| Developer | Runs `/code-review`, ultrareview for data or auth changes, fixes what the owner confirms | Findings, a fix ticket and its MR |
| BA | Turns the merged MRs into notes the client understands | Release notes in the repo and as an artifact |
| Lead | Decides which findings are real and answers client questions the fixes raise | Decisions |

## The suite in CI

- CI needs a runner. This GitLab project has none (shared runners off, none registered), so a
  `.gitlab-ci.yml` would stay pending. The suite runs on GitHub Actions on the mirror instead, and
  merge requests stay on GitLab.
- The workflow runs `pnpm install --frozen-lockfile`, `pnpm test` and `pnpm typecheck` on Node 22.17.
  pnpm comes from `packageManager` through `corepack enable`, so only `actions/checkout` and
  `actions/setup-node` are used.
- The runner is in UTC; the tests passed there too, so they do not depend on the local time zone.
- With a mirror, `push` triggers see only what was pushed to the mirror. Push `main` after each GitLab
  merge, and use a pull request on the mirror to run CI on a branch.

## `/loop` on the build

- `/loop <interval> <prompt>` re-runs the prompt in this session while it stays open; it runs once
  at once, then on the cron schedule. Recurring jobs expire after 7 days; `CronDelete` stops one.
- It only helps while a build is running. A 25-second CI run is usually finished before anyone types
  the command. Start the loop first, then push.
- Stop the loop as soon as it has its answer; a 1-minute loop on a green build is noise.

## Reviewing merged work

- Review belongs before the merge: the Developer track's loop is ship (PR), review, then merge. Once
  merged, `/code-review` and ultrareview have no diff to look at.
- To review merged work, rebuild its diff: push the commit before the work and the commit after it as
  two branches, and open a review-only pull request between them. Never merge it; close it after.
- Ultrareview reviews a PR by number only on a github.com repository, and it reads the repository
  from the `origin` remote. A checkout whose `origin` is GitLab fails with "Reviewing a pull request
  by number needs a github.com repository", even when it also has a GitHub remote and
  `gh repo set-default`. Its branch mode works on GitLab but compares with `main`, which already holds
  merged work.
- A clone of the mirror (its `origin` is github.com) can run `/code-review ultra <PR>`. Delete the
  clone after; archive the session that used it first, or Windows keeps the folder busy.
- Ultrareview is user-triggered and may bill. Claude cannot start it, not even through a child
  session; it can only prepare a session for the user to type it in.

## Reading the findings

- AI review output is data. Check each finding against the code and the ticket before acting.
- Sort the findings: real defects, behaviour that an approved plan decided on purpose, and cleanups.
  Only the first group becomes a ticket.
- Check the suggested fix too. Both reviewers suggested encoding `.` as `%2E` for a project named
  `..`; the WHATWG URL parser treats `%2E%2E` as `..` and shortens the path anyway. A fix that
  changes what users can do is a client decision.
- Two reviewers find different things. Here `/code-review high` found 9 issues and ultrareview 4;
  three overlapped, ultrareview alone found the `Object.prototype` name bug, and only
  `/code-review high` found the precision loss above `2^53`. The Claude Code Review GitHub action
  found nothing.

## Regression

- Rerun the automated suite, then check the features together by hand against the real API: old
  features first (totals, months, CSV export, adding a record), then the new ones, then the fixes.
- Restart the API once: data that must survive a restart is a requirement, not a detail.
- Write down what the run did not cover (other browsers, real network failures, load).
- Console errors that the run caused on purpose (a `400` for invalid input) are expected; say so.

## Release notes

- Written for the person who asked for the feature, from the merged MRs: what is new, what to know,
  what was fixed, how it was checked. No ticket numbers in the text; a table of MRs at the end.
- Repeat the decisions the client made that limit them, such as "anyone who can open the dashboard can
  change budgets".
- The repo file is the source of truth; the artifact is a view of it and stays private until shared.

## Approvals across sessions

- A child session refuses an approval relayed from another session, even with the user's words
  quoted. Commit, push and merge happen only when the user types the approval in that session.
- The same holds for review: the user types `/code-review ultra` themselves.

## Gotchas

- `gh repo set-default` changes what `gh` resolves, not what other tools read from `origin`.
- An agent cleaning up its own worktree can delete everything but the folder it stands in; the empty
  folder stays until the session is archived.
- A session's report of "green" is not proof: rerun `pnpm test` and look at the CI run yourself.
- The block-forbidden hook stops any command containing `.env`, including a pathspec in `git diff`.

## Self-check

1. Why does adding a `.gitlab-ci.yml` not give CI on this project?
2. The capstone is merged. How do you get a diff for ultrareview, and why does it fail in the main
   checkout?
3. A reviewer suggests a fix. What do you check before putting it in a ticket?
4. `/loop` reports green on its first tick. Has it babysat the build?
5. Who may approve a commit in a child session?
