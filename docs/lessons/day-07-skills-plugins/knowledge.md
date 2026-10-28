# Day 07: skills, a personal command and a plugin

Course: [Day 07](https://dojo.agilityio.dev/schedule/day-07.html), Developer track. Required
reading: the course [Introduction to agent skills](https://academy.claude.com/courses/introduction-to-agent-skills)
(6 lessons, about 1 hour) and the docs on [skills](https://code.claude.com/docs/en/skills),
[plugins](https://code.claude.com/docs/en/plugins/overview) and
[discovering plugins](https://code.claude.com/docs/en/discover-plugins). The rest comes from
running the exercises on this repo.

## Agent skills (course, 6 lessons)

- **What a skill is:** a folder with a `SKILL.md` file: YAML frontmatter between two `---` lines,
  then instructions. Only the `name` and `description` of every skill are always in context; the
  body loads when a request matches the description (by meaning, not by words) or when you type
  `/<name>`.
- **Where:** personal skills in `~/.claude/skills/<name>/` (Windows:
  `C:/Users/<user>/.claude/skills/`), project skills in `.claude/skills/<name>/`, committed so
  everyone who clones gets them. Same name: Enterprise beats Personal beats Project. Plugin skills
  are namespaced `/<plugin>:<skill>`, so they never clash.
- **Rule of thumb:** explaining the same thing to Claude a second time means a skill is waiting to
  be written.
- **Frontmatter:** all fields are optional; `description` is the one that matters. A good
  description says what the skill does and when to use it, with the phrases you really say.
  - `allowed-tools` pre-approves tools for the rest of that turn only. It does not restrict
    Claude: other tools still go through normal permissions. A bare `Bash` approves every shell
    command; narrow it with patterns like `Bash(git status *)`.
  - `disable-model-invocation: true`: only you can run it with `/<name>` (good for side effects or
    personal routines). `user-invocable: false`: only Claude can, hidden from the `/` menu.
  - `argument-hint`, `$ARGUMENTS`, `$0`: arguments typed after `/<name>`.
  - `model`, `context: fork` (run in a subagent), `paths` (only for matching files).
- **Size:** keep `SKILL.md` under 500 lines; put extra docs in `references/`, code in `scripts/`
  ("run, don't read" saves tokens), templates in `assets/`.
- **Skills vs. the rest:** CLAUDE.md is always on (project rules, hard limits); a skill is
  on-demand know-how; a subagent works in its own context; a hook runs on events; MCP adds tools.
  Custom commands are now skills.
- **Sharing:** repo `.claude/skills/` for team process; a plugin for skills useful outside the
  project; managed settings for what must be enforced. Built-in subagents do not preload skills;
  a custom subagent can, with the `skills` field.
- **Troubleshooting:**
  - Run `claude plugin validate .claude/skills` (or `~/.claude/skills`) first; it needs v2.1.233
    or later. Pointing it at one skill folder fails ("No manifest found"); point it at the
    `skills` folder.
  - Broken YAML still loads the skill with empty metadata: `/<name>` works, auto-invocation does
    not.
  - A `skills` folder created during a session is not watched: run `/reload-skills`.
  - Not triggering is almost always the description: add the words people actually type.
  - After `/compact`, only the first 5,000 tokens of each invoked skill are kept, 25,000 in total.

## Plugins

- A plugin bundles skills, agents, hooks, MCP servers and LSP servers. Install in Desktop with
  **+** → **Add plugins**, or `claude plugin install <name>@<marketplace> --scope user|project|local`.
- `claude plugin details <name>` shows the components and the **Always-on** token cost added to
  every session. It only works for installed plugins.
- The official marketplace `claude-plugins-official` lists 315 plugins today. For this repo the
  useful ones are `typescript-lsp` and `hookify` (day 11 hook). `commit-commands` targets GitHub
  (`gh`), and `gitlab` duplicates `glab`.

## Code intelligence (LSP plugins)

- An LSP plugin is only configuration: it starts a language server binary that must be on `PATH`
  (`npm install -g typescript-language-server typescript` for `typescript-lsp`). It does not run
  in cloud sessions.
- After each edit the server pushes diagnostics ("Found N new diagnostic issues"), so type errors
  show up before `pnpm typecheck`. The `LSP` tool also gives `findReferences`, `goToDefinition`,
  `hover` and call hierarchy, more precise than `grep`.
- **Pitfall in this repo:** `typescript` 7 (the Go port, used here) has no `lib/tsserver.js`, and
  `typescript-language-server` 5.3.0 needs it. Fix: keep `typescript@6.0.3` installed globally;
  see [exercise-plugin-eval.md](exercise-plugin-eval.md).

## What I did and saw

- **Team skill:** [`.claude/skills/ship-ticket/SKILL.md`](../../../.claude/skills/ship-ticket/SKILL.md),
  merged in [MR !10](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/10).
  See [exercise-skill-and-command.md](exercise-skill-and-command.md).
- **Personal command:** `/dojo-day NN` in `~/.claude/skills/dojo-day/`, not in the repo.
- **Plugin:** `typescript-lsp` at user scope; evaluation in
  [exercise-plugin-eval.md](exercise-plugin-eval.md).
- **EXP-108** with the new skill and plugin: TDD, `/ship-ticket EXP-108`, merged in
  [MR !11](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/11)
  (89 tests).

### Pitfalls met

- `/ship-ticket` before committing marks the plan, test and backlog checks FAIL: it diffs
  `main...HEAD`, which only sees commits. Run it after committing, or extend it to
  `git diff main`.
- With no argument, `$ARGUMENTS` renders as an empty code span in the skill body; the skill must
  say what to do when it is empty.
- A new Desktop session may start in a worktree cut from `main`, which does not have uncommitted
  skill files; test a new project skill in the session where it was written.
- GitLab was unreachable for a few minutes (ports 443 and 22 timed out); the commit waited
  locally and the push worked on retry.

## Self-check

1. A new `.claude/skills/` folder, and `/ship-ticket` is missing. Why? The folder did not exist
   when the session started; run `/reload-skills`.
2. A skill has `allowed-tools: Read, Grep`. Can Claude still edit files? Yes, through normal
   permissions; `allowed-tools` only pre-approves.
3. Why does `/dojo-day` set `disable-model-invocation: true`? It fetches pages and writes to the
   handbook; it should run only when asked.
4. The LSP plugin is installed but no diagnostics ever appear. First check? That the language
   server binary is on `PATH` and can find a TypeScript with `tsserver.js`.

## Sources

- [Introduction to agent skills](https://academy.claude.com/courses/introduction-to-agent-skills)
- [Skills](https://code.claude.com/docs/en/skills)
- [Plugins](https://code.claude.com/docs/en/plugins/overview) ·
  [Discover plugins](https://code.claude.com/docs/en/discover-plugins) ·
  [Code intelligence](https://code.claude.com/docs/en/plugins/code-intelligence)
