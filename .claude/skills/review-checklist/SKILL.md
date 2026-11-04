---
name: review-checklist
description: Reviews a branch's diff against the team's code-review checklist (correctness, tests, readability, security basics, scope). Use when the user says "review checklist", "review this branch by the checklist", or "review my partner's MR".
argument-hint: [branch]
allowed-tools: Read, Grep, Glob, Bash(git status *), Bash(git diff *), Bash(git log *), Bash(git branch *), Bash(pnpm test), Bash(pnpm typecheck)
---

# Review checklist

The Day 3 code-review checklist as a repeatable pass over one branch. It only reads and reports.

## Hard rules

- Never edit files. Never commit, push, comment on or merge an MR.
- Never read or print `.env` files.
- Report only what the code shows. Run or read the code before calling something a bug; if it could not be checked, say so.
- Never invent a comment to reach a number. Fewer than 3 real comments is a valid result.

## Steps

The target branch is `$ARGUMENTS`, or the current branch if that is empty. Read the changes with
`git diff --merge-base main <branch>` and `git log main..<branch> --format='%h %s%n%b'`. For the
current branch, also run `git status --short` and read new untracked files, which the diff does not show.

Go through the areas in this order and finish each one before starting the next:

1. **Correctness.** Does the code do what the ticket in `docs/tickets/` asks? Check edge cases, error paths and the callers of changed code.
2. **Tests.** Run `pnpm test` and `pnpm typecheck` if the branch is checked out; otherwise mark them not run. Does a test fail without the change and cover its edge cases? No existing assertion or expected value may be changed to make a test pass.
3. **Readability.** Can another developer follow it without asking? Check names, duplicated logic, and whether the code matches the code around it.
4. **Security basics.** Check input validation, SQL built from strings, secrets in code or logs, and new dependencies.
5. **Scope.** Does every changed file belong to the ticket and its plan in `docs/plans/`? List unrelated changes and anything the ticket asked for that is missing.

## Comments

Every comment must be actionable: `file:line`, what goes wrong in a concrete case, and the change to make. Remove a comment if the author could not act on it.

## Output

First, a table with one row per area, a status of PASS, COMMENTS or NOT CHECKED, and one line of evidence:

| # | Area | Status | Evidence |
|---|------|--------|----------|

Then the comments, ordered by area. Close with the number of actionable comments and what was not checked. This pass does not replace `/code-review` or a human reviewer, who decides which comments stand.
