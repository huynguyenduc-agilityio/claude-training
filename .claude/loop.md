Check the open merge request for the current branch with `glab mr view --comments`.
If there is no open merge request for this branch, say so in one line and stop.

1. If there are new review comments since the last check, list each one with a suggested reply
   and a proposed change. Do not push, reply on GitLab or resolve threads without asking.
2. If the merge request has merge conflicts or is behind `main`, say so and propose the rebase
   steps (`git fetch origin`, `git rebase origin/main`, then `pnpm test` and `pnpm typecheck`).
3. This repo has no GitLab CI, so run `pnpm test` and `pnpm typecheck` locally. If either fails,
   diagnose it and propose a minimal fix; do not edit tests to make them pass.

If everything is green and quiet, say so in one line.
