---
name: ship-ticket
description: Runs the pre-merge checklist for a ticket branch and drafts the GitLab merge request description. Use when the user says "ready for a merge request", "ship EXP-1XX", "before merging", or "check my branch before the MR".
argument-hint: [EXP-1XX]
allowed-tools: Read, Grep, Glob, Bash(git status *), Bash(git diff *), Bash(git log *), Bash(git branch *), Bash(pnpm test), Bash(pnpm typecheck)
---

# Ship a ticket

Checklist to run before opening or merging a GitLab merge request for a ticket. It only reads and reports.

## Hard rules

- Never commit, push, open or merge the MR.
- Never edit files. Never read or print `.env` files.
- If a check fails, mark it FAIL and go on to the next check. Do not try to fix it.

## Steps

0. **Resolve the ticket id.** Use `$ARGUMENTS` if given. Otherwise infer it from the branch name (`git branch --show-current`) or the latest commits (`git log -5 --oneline`). If still unknown, ask the user.
1. **Tests and types.** Run `pnpm test` and `pnpm typecheck`. Both must pass. Show the summary lines.
2. **Plan matches diff.** `docs/plans/<ticket>-*.md` must exist. Run `git diff main...HEAD --stat` and compare it with the plan's "Files to change" section. List extra files and missing files.
3. **Tests for the ticket.** A test was added or changed for the ticket. Check `git diff main...HEAD -- '*.test.ts'`: no existing assertion or expected value may be weakened or changed. Changing only a fixture's shape for a new type needs the user's approval, so flag it.
4. **Commits.** Run `git log main..HEAD --format='%h %s%n%b'`. Every subject follows Conventional Commits with the ticket id, for example `fix(usage): reject negative token counts with 400 (EXP-105)`. No message has AI attribution: no `Co-Authored-By: Claude` trailer, no "Generated with Claude Code" line.
5. **MR description.** Draft it with the sections What, Why, How tested, Notes for reviewer. No AI attribution. Base it on the ticket in `docs/tickets/<ticket>.md`, the plan and the diff.
6. **Backlog row.** The row for the ticket in `docs/tickets/README.md` is marked `Done` on this branch (check the diff against main).
7. **Safety.** No `.env` file was read or changed (`git diff main...HEAD --stat`, `git status`). No dependency was added or changed in any `package.json` or `pnpm-lock.yaml` without approval. Flag any dependency diff for the user.

## No-ticket branches

For docs-only or tooling branches with no ticket, report checks 2, 3 and 6 as N/A. Run the rest.

## Output

First, a table with one row per check (0 to 7), a status of PASS, FAIL or N/A, and one line of evidence:

| # | Check | Status | Evidence |
|---|-------|--------|----------|

Then the MR description draft:

```markdown
## What
## Why
## How tested
## Notes for reviewer
```

Close with the list of things the user must do next (commit, push, open the MR). Do none of them yourself.
