# Day 10: review and quality

Course: [Day 10](https://dojo.agilityio.dev/schedule/day-10.html), Developer track. The day assigns
no course; the reading is the docs of the features it names. It asks for `/code-review` on a real
branch, ultrareview on a seeded branch with a comparison of signal, a walkthrough of the security
plugins, and the `review-checklist` skill. The rest comes from running that on this repo.

The tools are layers, not rivals: each one sees a different moment and costs a different amount.

| When | Tool | Cost |
|---|---|---|
| While Claude writes | `security-guidance` | Pattern match is free; the deeper tiers use your usage |
| One pass before a commit | `/security-review` | Normal usage |
| Quick check while working | `/code-review` | Normal usage |
| Deep security scan of a diff or the repo | Claude Security | Normal usage, can be heavy |
| Before merging a large or risky change | `/code-review ultra` | A free run, then about 5 to 25 USD |
| In CI | Static analysis, dependency scan | AI does not replace them |

## /code-review

- **No target:** the branch's commits ahead of its upstream plus uncommitted changes. With no
  upstream, it compares with `main`.
- **With a target:** `main...my-feature`, `abc1234^..abc1234`, a PR number or a path.
- **Effort:** `low` reports what it is surest of; `medium` to `max` cover more. The level you type
  is reused next time, even in another session, so record it when comparing runs.
- **Flags:** `--fix` edits the working tree, `--comment` posts to the PR or MR,
  `--max-findings <n>|all|default` changes the limit.
- **Self-hosted GitLab:** `--comment` needs a URL or `!123`; a bare number is not read as an MR.
- **`--fix` runs in the background**, so `/rewind` does not restore everything. Use git.
- **Rules come from `CLAUDE.md`.** `REVIEW.md` belongs to the Code Review service on GitHub.

## Ultrareview

- **Who runs it:** only the user. A dialog shows the scope, the free runs and the price.
  `/ultrareview` is a deprecated alias for `/code-review ultra`.
- **Two modes:** with no PR number it bundles the repo and compares the branch with the default
  branch, uncommitted changes included. A PR number works only on `github.com`, so a GitLab repo uses
  branch mode, and no GitHub remote is needed.
- **Your code leaves the machine.** Branch mode uploads the repo to Anthropic's cloud. That is fine
  for this public practice repo; ask the lead first for a client's repo.
- **Limits:** 500 files and 8,000 lines by default; an empty diff is refused. It takes 5 to 15 minutes.
- **Price:** 3 one-time free runs that do not come back, then usually 5 to 25 USD in usage credits.
  A stopped or failed run still uses one up, and a stopped run gives no partial result.
- **Scripts:** `claude ultrareview` waits and prints the result; `claude -p '/code-review ultra'`
  exits before there is a result.

## security-guidance

- **What it is:** a plugin built on hooks, with no command to type.
- **Three tiers:** on each edit, a pattern match with no model call; at the end of a turn, a separate
  Claude reads the git diff; on each commit or push that Claude runs through Bash, a deeper review.
- **It never blocks.** Findings are guidance for Claude, and a commit you type yourself is not
  reviewed. To enforce a rule, use a blocking hook or CI.
- **Cost:** the two model tiers use Opus by default and count against usage. That is why both plugins
  were turned off after the exercise.
- **Outside the repo:** the first run creates a venv in `~/.claude/security/` and installs the Agent
  SDK with `pip`. The log is `~/.claude/security/log.txt`.

## Claude Security

- **What it is:** the `claude-security` plugin. `/claude-security` runs a multi-agent scan, checks
  findings separately, and can suggest patches that are never applied by themselves.
- **Three jobs:** scan the codebase, scan changes (a branch, PR or commit), suggest patches.
- **Output:** `CLAUDE-SECURITY-<timestamp>/` in the repo, with its own `.gitignore`, so it stays out
  of commits.
- **Needs on this machine:** the `Workflow` tool (Dynamic workflows, set in `/config`), a working
  `python3` of 3.9 or newer, and a valid login in the session that runs it.
- **Windows:** the Python installer ships `python.exe` only, so `python3` is not found even with
  Python on `PATH`.
- **Read the stamp with care:** `verified` with `panel_votes: 0` means there was nothing to vote on,
  not that a panel confirmed the code is safe. Read how the report says it was verified.

## Plugins and scope

- **Two install paths:** Add in Settings → Customize turns a plugin on for the claude.ai account, with
  no repo scope. To scope one to a repo, use
  `claude plugin install <name>@claude-plugins-official --scope local`, which writes
  `.claude/settings.local.json`.
- **Turn it off:** `claude plugin disable <name>@claude-plugins-official --scope local`. The entry
  stays in the file with the value `false`.
- **A plugin runs real code:** its hooks have your full user rights, outside the sandbox and the
  permission rules. A marketplace's name says nothing about what a plugin does.
- **Sessions load plugins, skills and hooks at startup.** A session already open does not see them,
  and a local-scope install is tied to its folder, so a worktree session does not see it either.
- **`/config` opens only in the terminal `claude`,** not in the Desktop app.

## /effort and ultrathink

- **Levels:** `low`, `medium`, `high`, `xhigh`, `max`. `ultrathink` raises it for one turn.
- **Saved default:** Enter in the slider, or typing `/effort high`, saves it for later sessions. Press
  `s` in the slider to keep it to this session. `max` is always for this session only.

## review-checklist

The Day 3 checklist, in order: correctness, tests, readability, security basics, scope. It lives in
`.claude/skills/review-checklist/SKILL.md` and only reads. `ship-ticket` is the gate before opening
your own MR; this is the pass a reviewer makes.
