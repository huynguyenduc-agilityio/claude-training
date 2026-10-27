# Day 06: flagship features, parallel work and Checkpoint 2

Course: [Day 06](https://dojo.agilityio.dev/schedule/day-06.html), Developer track. Required
reading: the course [Introduction to subagents](https://academy.claude.com/courses/introduction-to-subagents)
and the [Artifacts](https://code.claude.com/docs/en/artifacts) docs. The other sections come from
the official docs for each feature and from running the exercises on this repo.

## Subagents (course, 4 lessons)

- **What they are:** a subagent runs in its own context window. It starts with only its system
  prompt and a task description written by the main agent, does the reading and tool calls there,
  and returns a summary. The main context stays clean; the cost is that you do not see how it got
  to its answer. Built-in: general-purpose, Explore, Plan.
- **Creating one:** ask Claude to write the file (the `/agents` wizard was removed in v2.1.198).
  Project scope `.claude/agents/`, user scope `~/.claude/agents/`. Frontmatter: `name` (call with
  `@agent-<name>`), `description` (one line; "proactively" makes Claude delegate on its own),
  `tools`, `model` (`haiku`, `sonnet`, `opus`, `fable`, a full ID or `inherit`), `color`. The body is
  the system prompt. Restart the session if the agents folder did not exist when it started.
- **Designing one:** the description decides when the subagent runs and shapes the task prompt the
  main agent writes ("You must tell the agent precisely which files you want it to review"). An
  output format is the biggest improvement: it gives a stopping point. Add an "Obstacles
  Encountered" section so workarounds come back. Limit tools: research gets `Glob`, `Grep`, `Read`;
  a reviewer adds `Bash` but not `Edit`/`Write`.
- **When to use one:** ask "does the intermediate work matter?" No: delegate (research, code
  review, work that needs its own system prompt). Yes: keep it in the main thread. Avoid "expert"
  personas, sequential pipelines where each step needs the last one's findings, and test runners
  that hide the output you need to debug.

## Artifacts

- A live page Claude publishes from the session to a private claude.ai URL; it updates in place
  and each publish is a version. Use it when the output is easier to look at than to read: an
  annotated diff, a dashboard, options side by side, an investigation timeline.
- Private until shared from the page's Share control. `/artifacts` finds them again (`Enter`
  attach, `o` open, `c` copy link, `d` delete); `Ctrl+]` reopens the latest one. To update from
  another session, give Claude the URL.
- Limits: one self-contained page, no backend, 16 MiB; scripts only from a few CDNs, fonts from
  Google Fonts; a page cannot start a download by itself. Needs Pro, Max, Team or Enterprise and a
  claude.ai login.

## /loop

- `/loop 5m <prompt>` runs on a fixed schedule; `/loop <prompt>` lets Claude pick the delay;
  `/loop` or `/loop 15m` alone runs the built-in maintenance prompt (continue unfinished work, tend
  the branch's PR, then clean up), or `.claude/loop.md` when it exists (project wins over
  `~/.claude/loop.md`, plain Markdown, ignored when you type a prompt, truncated after 25,000 bytes).
- Runs only between turns while the session is idle and open; missed runs are not caught up; at
  most 50 tasks per session; recurring tasks expire after 7 days.
- **Stopping:** `Esc` stops only a self-paced loop. A fixed-interval loop is cancelled by asking
  Claude ("cancel the deploy check job") or with `CronDelete <id>`.
- **Pitfall:** the maintenance prompt talks about "pull requests" only. This repo is on GitLab, so
  `.claude/loop.md` tells Claude to use `glab` and to run tests locally (there is no GitLab CI).

## Remote Control

- Steers a session that keeps running on your machine from the Claude app or claude.ai/code. Start
  with `/rc` in the session or the Remote Control switch in the session's Environment card.
- Pro, Max, Team, Enterprise; not with an API key. The machine must stay awake and the app open;
  quitting it or shutting down takes the session offline.
- From the phone, `/model`, `/effort`, `/compact`, `/clear`, `/context`, `/rename` work; `/plugin`
  and `/resume` are local only.

## Worktrees and parallel sessions

- A worktree is a separate checkout on its own branch that shares the repository history, so two
  sessions can edit without overwriting each other. Desktop: turn on **Worktree** in the project
  folder control before the first prompt; worktrees live in `.claude/worktrees/` (now in
  `.gitignore`). CLI: `claude --worktree <name>`.
- A worktree is a fresh checkout: run `pnpm install` in it. In Desktop, settings, hooks and skills
  come from the main checkout; CLAUDE.md comes from the worktree.
- "Agent view" is the CLI screen `claude agents`. Desktop has no such screen; watch sessions in the
  sidebar, `Ctrl+Tab`, or split view (Alt+click a session).
- Merge one at a time: merge the first MR, rebase the second onto `main`, run the tests, push with
  `--force-with-lease`, wait until GitLab says mergeable, then merge.

## Effort and ultrathink

- Levels on Opus 5.5 and Sonnet 5.5: `low`, `medium` (default), `high`, `xhigh`, `max`. Set with
  `/effort`, `/effort <level>`, `Ctrl+Shift+E` in Desktop, `--effort` or `CLAUDE_CODE_EFFORT_LEVEL`.
  `max` applies to the current session only.
- `ultrathink` anywhere in a prompt asks for deeper reasoning for that turn; the effort setting is
  unchanged. "think hard" is not a keyword.
- The same level name is calibrated differently per model; compare on one model only.
- Result on EXP-101: all levels found the right cause; see [exercise-effort.md](exercise-effort.md).

## Cloud sessions

- Run on an Anthropic VM, keep going with the laptop closed, and are watched from claude.ai/code,
  the phone app or Desktop. Pro, Max, Team; Enterprise with premium or Chat + Claude Code seats.
- Cloning and pushing need GitHub (the Claude GitHub App grants access). A GitLab repo can only be
  sent as a bundle (`CCR_FORCE_BUNDLE=1 claude --cloud "..."`) and nothing is pushed back. This
  repo uses a GitHub mirror (remote `github`) for cloud sessions only; MRs stay on GitLab.
- The VM pauses when idle and is later reclaimed; the conversation survives but running commands,
  subagents and `/loop` do not. A cloud session does not see local MCP servers or `.env`.

## What I did and saw

- **Two tickets in parallel:** EXP-102 and EXP-104 ran in two worktree sessions. EXP-104 merged
  first ([MR !6](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/6),
  `38542b5`); EXP-102 was rebased onto it without conflicts and merged
  ([MR !7](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/7),
  `26c76dd`), 84 tests on the combined code.
- **Plan mode steered by diff comments:** EXP-102 went through plan mode, then four comments on the
  diff pane: a 5 s webhook timeout, one table scan per insert, a notification at 100% as well, and
  the server deciding the current month. All were applied in one round.
- **Artifact:** an annotated walkthrough of MR !6 with findings by severity.
- **/loop:** `/loop 5m check the deploy` against `GET /api/health` reported `ok`, then reported the
  failure (connection refused) after `pnpm dev` was stopped. `/loop 15m` on MR !6 reported it
  mergeable with tests green. Both were cancelled with `CronDelete`.
- **Remote Control:** the commit and MR for EXP-102 were requested from the phone.
- **Cloud:** a coverage audit ran with the laptop closed and was checked from the phone; see
  [cloud-coverage-audit.md](cloud-coverage-audit.md). It ran on the mirror at `c0257f9` (43 tests),
  before EXP-102 and EXP-104.
- **Effort:** see [exercise-effort.md](exercise-effort.md).
- **Loop prompt for this repo:** [`.claude/loop.md`](../../../.claude/loop.md).

### Pitfalls met

- A session cannot start a cloud session on a named GitHub repository for you; start it from
  Desktop (New session, Cloud, pick the repository).
- A session started from another one cannot use a higher effort than its parent.
- After the app restarts, local sessions show as offline; open them from the sidebar to resume.
- The cloud session stayed in plan mode and asked before committing; it needed an explicit
  "commit and push".
- An analysis-only prompt in plan mode still ended with a request to leave plan mode.
- On Windows, `git worktree remove` fails ("Directory not empty", "Invalid argument") while
  `node_modules` or an open session holds the folder; delete the folder, then `git worktree prune`.
- Parallel sessions use quota fast: the Pro weekly limit reached 89% during the day.
- The cloud audit found three real server bugs (huge token counts, prototype keys as model names,
  cached tokens above input tokens). They are left for new tickets.

## Self-check

1. You press `Esc` and `/loop 5m` keeps running. Why? `Esc` stops only a self-paced loop; cancel a
   fixed-interval loop by asking Claude or with `CronDelete`.
2. A GitLab-only repo: can a cloud session clone it and open an MR? No; it needs GitHub, a bundle
   can be sent up but nothing is pushed back.
3. Does `ultrathink` change the effort level shown? No; it adds deeper reasoning for one turn.
4. Should a test runner be a subagent? No; you need the full output when tests fail.

## Sources

- [Introduction to subagents](https://academy.claude.com/courses/introduction-to-subagents)
- [Artifacts](https://code.claude.com/docs/en/artifacts)
- [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks)
- [Remote Control](https://code.claude.com/docs/en/remote-control)
- [Worktrees](https://code.claude.com/docs/en/worktrees) · [Agent view](https://code.claude.com/docs/en/agent-view)
- [Model config (effort)](https://code.claude.com/docs/en/model-config)
- [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Desktop](https://code.claude.com/docs/en/desktop)
