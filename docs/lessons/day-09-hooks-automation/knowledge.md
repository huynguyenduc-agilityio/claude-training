# Day 09: hooks and automation

Course: [Day 09](https://dojo.agilityio.dev/schedule/day-09.html), Developer track. The day assigns
no course; the reading is the docs of the features it names. It asks for one hook shipped as a pull
request, `@claude` on the repository, a real review to evaluate, `/goal` on a ticket, a Desktop
scheduled task, and an overview of Routines. The rest comes from running that on this repo.

`CLAUDE.md` only reminds; a hook is enforced by the machine. The automation ladder answers two
questions: when does the next turn start, and where does the work run.

## Hooks

- **Three levels:** event (`PreToolUse`) → matcher group (`Bash`) → handler (command, HTTP, MCP
  tool, prompt, agent).
- **Where it lives:** `~/.claude/settings.json` (you, every project), `.claude/settings.json`
  (project, committed), `.claude/settings.local.json` (project, not shared), a plugin, or a skill's
  frontmatter. The levels add up; none replaces another.
- **Which type:** a fixed rule is `command`; judgment from the input is `prompt`; reading files or
  running commands to decide is `agent`.
- **Exit codes:** 0 means no objection, and the action still goes through the normal permission
  flow. 2 blocks, and stderr becomes feedback for Claude. Any other code is a non-blocking error,
  so the action runs.
- **Exec form:** with `args`, Claude runs the executable directly, with no shell and no quoting. Use
  it for `${CLAUDE_PROJECT_DIR}` paths. On Windows it needs a real `.exe`, so call `node` with the
  script path.
- **`onFailure: "block"`** (2.1.295 or later): a script that cannot run, times out or returns another
  code blocks the action. By default a broken hook lets everything through.
- **Windows matcher:** a hook that checks commands needs `Bash|PowerShell`. `Bash` alone misses
  commands run through the PowerShell tool.
- **Stop hooks** fire every time Claude finishes answering, not only when the work is done. Read
  `stop_hook_active` to avoid a loop.
- **Check it:** `/hooks` only shows what is loaded. `"disableAllHooks": true` turns off every hook;
  one hook cannot be turned off alone. Hooks also run inside subagents.
- **Security:** a command hook runs with your full user rights. `claude -p` does not ask to trust the
  folder, so read `.claude/` in an unfamiliar repository first.

## /goal

- A prompt-based Stop hook that lives only in the session. After each turn a small model reads the
  conversation and answers: not yet, done, or impossible.
- **The evaluator calls no tools.** It sees only what the conversation shows, so the condition must
  be something Claude's output can prove: a measurable state and a named check such as
  `pnpm test` passing.
- `/goal <condition>` starts a turn at once, `/goal` shows the status, `/goal clear` removes it. One
  goal per session; `/clear` removes it too.
- Use it for large work with a checkable end. Use `/loop` to repeat on a timer and a Stop hook for a
  rule that applies to every session.
- Auto mode and `/goal` complement each other: auto mode skips approval per tool, the goal skips
  prompting per turn.

## Scheduling: where the work runs

| | Desktop scheduled task | Cloud scheduled task (formerly Routines) | GitHub Actions |
|---|---|---|---|
| Runs on | Your machine | Anthropic's cloud | GitHub runners |
| Needs the machine on | Yes, app open and awake | No | No |
| Sees local files | Yes, including uncommitted changes | No, a fresh clone each run | No, a checkout |
| Starts on | A schedule or Run now | A schedule, API call or GitHub event | Repository events |
| Permission mode | Set per task | Not chosen: auto mode | Tools allowed in the workflow |

- **Desktop:** a missed run catches up once, for the latest miss within 7 days, so a prompt should
  handle a late start. In Manual mode a run stalls on a tool it may not use until you answer in that
  run's session.
- **Two things are called Manual in the Edit form:** the permission mode (the **Auto** menu under the
  instructions) and the schedule. The schedule option turns the timer off.
- **Cloud:** runs carry your identity and draw on your subscription. All connected connectors are
  included by default, so remove the ones the task does not need. Text sent to `/fire` arrives
  labeled as untrusted, and the saved prompt must opt in to act on it. `Succeeded` only means the
  session ended normally: read the transcript. Cron hours are UTC unless `CRON_TZ=` is set.

## @claude with GitHub Actions

Three pieces are needed, and `/install-github-app` sets up all of them:

| Piece | What it does |
|---|---|
| Claude GitHub App | Lets Claude read the repository and comment |
| Secret `CLAUDE_CODE_OAUTH_TOKEN` | Runs on the subscription; the token lasts one year |
| Files in `.github/workflows/` | Say when to run: `claude.yml` on an `@claude` mention, `claude-code-review.yml` on pull request events |

- **Who can call it:** people with write access. Bots are blocked unless listed, and pull requests
  from forks get no secrets.
- **The app asks for more than the action needs,** because several features share it. Install it on
  one repository only.
- **Removing it:** delete the workflows, the secret and the app. Deleting the secret does not
  invalidate the token.
- **GitLab:** the CI/CD integration is a beta job on your own runner with a paid API key, and
  `@claude` needs a webhook listener. This project has no runner and `shared_runners_enabled` is
  false, so Day 9 ran on GitHub.

## What I built

| Item | Where | Result |
|---|---|---|
| Block-forbidden hook | [PR #2](https://github.com/huynguyenduc-agilityio/claude-training/pull/2) | 71 tests; `npm --version` blocked in Bash and PowerShell, `pnpm --version` runs |
| `@claude` workflows | [PR #3](https://github.com/huynguyenduc-agilityio/claude-training/pull/3) | Both active, secret set |
| EXP-107 | [PR #4](https://github.com/huynguyenduc-agilityio/claude-training/pull/4) | 110 tests pass, reviewed, see [exercise-claude-review.md](exercise-claude-review.md) |
| `morning-briefing` task | Local, weekdays 8:30, read-only prompt | One run, succeeded |
| `/goal` on a ticket | Not done on EXP-107 | The session's only `/goal` came after the merge, with no condition: `No goal set` |

The hook blocks `npm`, `yarn` and `npx`, reading `.env` files except `.env.example`, force pushes,
`git commit --no-verify`, and attribution lines. It is string matching, not a security boundary:
`cat .e*` gets through. It catches honest mistakes and sees only Claude's tool calls.

### Pitfalls met

- **`/goal` was never set on EXP-107.** Work continued as soon as the plan was approved, so there was
  no pause to type it, and the ticket merged without it. Only the user can type a slash command, so
  a plan that relies on one should stop and wait for it. I know the feature from the docs, not from
  a run.
- **The hook blocked my own pull request.** A heredoc body line starting with `npm` looked like a
  command. Heredoc bodies are now treated as data, with tests. Attribution lines inside them are
  still blocked.
- **`node --test .claude/hooks/` fails on Node 22.17.1.** Use `node --test ".claude/hooks/*.test.mjs"`.
- **`/install-github-app` stopped on a missing scope:** `gh auth refresh -h github.com -s repo,workflow`
  fixes it. The scope applies to every repository the account reaches, so remove it afterwards with
  `gh auth refresh -h github.com -r workflow`. It worked even though `origin` is GitLab.
- **The command opens a pre-filled page, not a pull request.** It pushes the branch; someone still has
  to create the pull request.
- **A green check does not mean a review ran.** The run on PR #3 shows `success`, but its log says
  `Skipping action due to workflow validation`: the action refuses a workflow file that differs from
  the default branch. Read the log.
- **Slash commands do not open in a Desktop session.** `/hooks` and `/install-github-app` ran from
  `claude` in the terminal.
- **The terminal `claude` was 2.1.263 and the Desktop session 2.1.309.** `onFailure` needs 2.1.295, so
  a broken script may not be blocked in the older one. I did not test that case.
- **A task created by asking Claude took the session's permission mode.** It was saved as Auto when
  Manual was wanted, and the Edit form was needed to change it.
- **`pnpm test` ran out of memory** with many sessions open. One worker passed, but the required
  command is the plain one, so I freed memory and reran it instead of changing the check.
- **GitLab can time out** on port 22. Local `main` stayed ahead until a later `git push origin main`
  worked.

## Self-check

1. A `PreToolUse` hook exits 0. Does the command run without asking? No. Exit 0 means no objection;
   the command still goes through the permission flow.
2. What is wrong with the `/goal` condition "the code is cleaner"? The evaluator reads only the
   conversation and needs a measurable state, so it can never tell when to stop.
3. A morning report needs uncommitted local files: Desktop task or cloud task? Desktop task. A cloud
   task starts from a fresh clone.
4. A review check is green and there are no comments. Did Claude find nothing? Not necessarily: open
   the log, as it may have skipped.
5. Claude's review says a merge commit has extra files. Accept it? Check first with `git diff --stat`
   against the first parent. The action clones with `fetch-depth: 1`, which can mislead it.

## Sources

- [Hooks guide](https://code.claude.com/docs/en/hooks-guide) ·
  [Hooks reference](https://code.claude.com/docs/en/hooks) ·
  [/goal](https://code.claude.com/docs/en/goal)
- [Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks) ·
  [Routines](https://code.claude.com/docs/en/routines)
- [GitHub Actions](https://code.claude.com/docs/en/github-actions) ·
  [GitLab CI/CD](https://code.claude.com/docs/en/gitlab-ci-cd) ·
  [Authentication](https://code.claude.com/docs/en/authentication)
