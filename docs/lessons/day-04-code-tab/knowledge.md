# Day 04: Claude Code in the Code tab

## Claude Code 101

Course: <https://academy.claude.com/courses/claude-code-101> · 12 lessons · about 1.5 hours · quiz
and a badge on the original course.

**Core idea:** Claude Code is an agent that works on your codebase itself. Work with it in the
rhythm explore, plan, code, commit; keep the context clean; read the diff yourself before
committing. Customize later with CLAUDE.md, subagents, skills, MCP and hooks.

Lessons 1–7 are used today and noted in full; lessons 8–12 are taught on later days, so only the
concept and the main pitfall are kept.

### 1. What is Claude Code?

- An agent is an LLM running in a loop: it reads code, edits files, runs commands and searches the
  web itself. Unlike chat, you do not copy and paste; Claude does the work.
- Three things to keep in mind: the context window is limited (Claude searches on purpose instead
  of loading the whole repo); the permission mode decides how much you step in; Claude can
  misunderstand, add bugs or do too much, so you stay in the loop.

### 2. How Claude Code works

- The loop: gather context, take action, verify results; when done, wait for the next prompt,
  otherwise loop again. You can interrupt, steer or add context at any step.
- When the context fills up, it is compacted automatically: summarized and trimmed, so details can
  be lost.
- Four modes: **Manual** asks before editing files and running commands; **Accept edits** edits
  files and runs common filesystem commands (`mkdir`, `mv`, `rm`) without asking, other commands
  still ask; **Plan** reads and runs exploring commands but does not edit source; **Auto** does not
  ask, a classifier blocks irreversible, destructive or outbound actions.
- Pitfall: the same mode has different names in different places (Manual = `default`,
  Accept edits = `acceptEdits` = "Auto-accept").

### 3. Installing Claude Code

- Five surfaces: terminal, VS Code, JetBrains, Desktop, web (web only with GitHub repos). The
  terminal gets new features first; Desktop suits work running in the background. The program uses
  Desktop.
- Claude Code can read the folder you open and every subfolder.
- Pitfall: installs from Homebrew or WinGet do not update themselves.

### 4. Your first prompt

- No mode is right or wrong; pick the level of supervision you are comfortable with.
- Plan mode: Claude researches, may ask questions, then returns a plan without editing source. Use
  it for complex, multi-step changes.
- The clearer the prompt, the less correcting afterwards. When it is done, look at what Claude
  changed and why.
- Pitfall: `Shift+Tab` changes the mode only in the CLI. In Desktop use the mode picker or
  `Ctrl+Shift+M`.

### 5. Explore, plan, code, commit

- **Explore and plan** (plan mode): Claude reads, may search the web, returns a plan. Approve it or
  ask for changes to a specific part. This is the cheapest moment to change direction: no code yet.
- **Code:** the plan has success criteria; tests are the source of truth (tests Claude writes must
  be trustworthy too); for a web UI give Claude a way to test it itself, such as Claude in Chrome.
- **Commit:** test it yourself, have a subagent with a fresh context review it, then a commit
  message in your style.
- To only understand code without changing it, use the Explore subagent; no plan mode needed.
- When Claude repeats the same mistake, ask it to write the fix into CLAUDE.md.

### 6. Context management

- Every prompt, file read, tool call and result goes into the context.
- `/compact` when you are in the middle of a feature and the context is nearly full; `/clear` when
  you move to a new feature; `/context` to see what takes the space. Knowledge needed across
  sessions belongs in CLAUDE.md.
- Pitfall: a vague prompt looks cheap but costs more context; MCP servers left on take space too.
  A question that only needs an answer can go to a subagent.

### 7. Code review

- The session that wrote the code is a poor judge of it. Read the diff yourself first, then have a
  clean context review it.
- Four things to always check: changes nobody asked for, weakened tests, a new package for one
  function, hard-coded values.
- `/diff` shows the changes; `/code-review` only reports, it does not fix; `low` gives fewer false
  alarms, `high` covers more; the chosen level is remembered.
- Pitfall: `/rewind` does not undo files changed by shell commands; `/diff` and `/code-review` need
  a git repo.
- For each finding: fix now, push back with a quote, or leave it for a later session. If the fix
  grows large, review again.

### 8–12. Later days

- **8. CLAUDE.md** (day 5): read at the start of every session, an onboarding script for the
  codebase. Start without one; run `/init` once you see what you keep correcting.
- **9. Subagents** (day 6): own context, can run in parallel, return only a summary. The
  description decides when one is called. Pitfall: restart after creating a new agents folder.
- **10. Skills** (day 7): CLAUDE.md is always loaded; a skill loads only its name and description
  until needed; a slash command must be typed. Explaining the same thing twice means make a skill.
- **11. MCP** (day 8): an open standard for external tools and data (`claude mcp add`, `/mcp`,
  `.mcp.json`). Pitfall: every server costs context even when unused; prefer a CLI such as `glab`.
- **12. Hooks** (day 9): hooks always run, CLAUDE.md is only "usually followed". Pitfall: only exit
  code 2 blocks; exit 1 does not.

### Self-check

1. Accept edits vs Auto? Accept edits approves only file edits and common filesystem commands;
   Auto asks nothing and a classifier blocks risky actions.
2. Mid-feature and the context is nearly full: `/compact` or `/clear`? `/compact`; `/clear` is for
   a new feature.
3. The four things to check in a diff? Unrequested changes, weakened tests, a package for one
   function, hard-coded values.

### Sources

- [Claude Code 101](https://academy.claude.com/courses/claude-code-101)

## Docs: quickstart, desktop, common workflows, best practices

**Core idea:** the first two pages get a first session running; common workflows are prompt
recipes for daily work; best practices revolve around one constraint: the context fills up fast,
and Claude needs a way to check its own work.

### Quickstart (CLI)

- Commands: `claude`, `claude -p "query"` (one-off), `claude -c` (continue the latest session),
  `claude -r` (pick a session), `/clear`, `/help`.
- Claude reads files when it needs them; you do not load context by hand.
- Pitfall: Homebrew and WinGet installs do not update themselves. On Windows, Git for Windows lets
  Claude use the Bash tool.

### Desktop get-started

- Under the prompt box: environment (Local, Cloud, SSH, WSL), folder, model; next to them the
  permission mode.
- In Accept edits or Auto, Claude applies changes and shows `+12 -1`; click it to open the diff,
  comment on a line, and Claude reads the comment and fixes it. In Manual, review each change.
- Steering: the stop button stops at once; typing a correction and pressing Enter sends it without
  stopping the work.
- `@filename` adds a file, `/` opens skills and commands, ``Ctrl+` `` opens the terminal; a dev
  server opens in the Browser pane.

### Common workflows

- General pattern: ask broad, narrow down, ask it to do the work, ask it to run the checks.
- Bugs: give the reproduction command and the stack trace, say whether it always or sometimes
  happens; ask for a few fixes before asking it to fix.
- Refactor in small, testable steps. Tests: state the behavior to check and ask for edge cases you
  missed.
- MRs: the session is linked to an MR that Claude opens with `glab mr create`; find it again with
  `claude --from-pr` or by pasting the URL into `/resume`.
- `@file` adds the content (up to 25,000 tokens by default) and pulls in that folder's CLAUDE.md;
  `@folder` adds only the file list.
- Scheduled tasks: the prompt must say what done means and what to do with the result, because
  nobody answers its questions.

### Best practices

- Root constraint: the context fills up fast and Claude gets worse as it fills. Almost every
  practice follows from this.
- Give Claude a way to check itself (tests, build, screenshots) and ask for proof; explore, plan,
  code, commit, but skip the plan when the diff fits in one sentence; steer early, and after two
  failed corrections `/clear` and write a better prompt.
- Specific prompts: name the files, point to sources and existing patterns, describe the symptom;
  for a large feature let Claude interview you and write a `SPEC.md`.
- Keep CLAUDE.md short; rules that must hold go into hooks.
- These are starting points, not laws: notice what works for you.

### Self-check

1. In Desktop, how do you correct course without stopping Claude? Type the correction and press
   Enter; the stop button stops at once.
2. What does `@src/components` add to the context? The file list, not the contents.

### Sources

- [Quickstart](https://code.claude.com/docs/en/quickstart)
- [Desktop get-started](https://code.claude.com/docs/en/desktop-quickstart)
- [Common workflows](https://code.claude.com/docs/en/common-workflows)
- [Best practices](https://code.claude.com/docs/en/best-practices)

## Permission modes tour

The same prompt in each mode on a scratch branch: "Add a one-line comment at the top of
`app/server/src/features/usage/cost.ts`, then run `pnpm test`". All four runs passed 29/29 tests;
each change was discarded.

| Mode | Edit file | Run `pnpm test` | What happened |
|---|---|---|---|
| Manual | asked | did not ask | After round 1 the session was already in Accept edits |
| Accept edits | did not ask | did not ask | Edited and ran tests at once |
| Plan | no edit | not run | Only wrote a plan; approving it switched the session to Auto |
| Auto | did not ask | did not ask | Carried out the approved plan with no prompts |

- **Allow rules beat modes.** `.claude/settings.local.json` allows `Bash(pnpm test *)` and
  `Bash(git checkout *)`, so even Manual did not ask before running the tests. A mode only decides
  what happens to actions no rule covers.
- **Approving an edit for the session changes the mode.** Choosing the session-wide option on the
  edit prompt in Manual moved the session to Accept edits.
- **Approving a plan means "go".** It leaves plan mode and starts the work. To only read the plan,
  reject it or reply with feedback.
- **Moving to a mode that does more needs your approval** (Plan < Manual < Accept edits < Auto <
  Bypass); moving down does not.
- **Auto does not check correctness.** It blocks risky intent; you still read the diff.

## Habits from common workflows and best practices

Each habit is "when X, I do Y", so it can be checked at the end of the day.

### Focus this afternoon

1. **Ask for file:line.** When Claude explains code, I make it cite file:line for every claim and
   open those lines myself. Applies to exercise 1 (explore and verify two claims).
2. **Give a way to check, ask for proof.** When I hand over a task, I name the check commands
   (`pnpm test`, `pnpm typecheck`) and ask for their output. Applies to EXP-105 and EXP-103.
3. **Steer early.** When Claude heads the wrong way, I type the correction and press Enter right
   away, or comment on the hunk, instead of waiting for it to finish. Applies to EXP-105.

### Giving work to Claude

- **Broad, then narrow.** When exploring, I ask for an overview first, then for one specific flow.
- **Scope the prompt.** I name the files, the symptom and an existing pattern to follow.
- **Bugs: reproduce, then options.** I give the reproduction steps and the error, and ask for a
  few fixes before asking it to fix.
- **Use `@file`.** I reference files with `@file` instead of pasting or describing them.

### Letting Claude check its own work

- **Give a way to check, ask for proof** (focus 2).
- **Tests: behavior and edge cases.** I state the behavior to test and ask Claude for edge cases
  I missed.
- **Plan only when it pays.** Multi-file work goes explore, plan, code; a change I can describe in
  one sentence skips the plan.
- **Ask for file:line** (focus 1).

### Managing sessions and context

- **Steer early** (focus 3).
- **Two failed corrections, then `/clear`.** After two corrections that do not work, I `/clear`
  and write a better prompt instead of correcting again.
- **One task, one session.** A new ticket or topic gets a new session.
- **MR linked to the session.** I let Claude open the MR with `glab mr create`, so the session is
  linked to it and I can find it again with `claude --from-pr`.

## Claude Code in action

Course: <https://academy.claude.com/courses/claude-code-in-action> · 9 lessons · about 1 hour ·
quiz and a badge on the original course.

**Core idea:** run long, lightly supervised sessions you can still trust. The less you watch, the
more you must check.

Lessons 1, 4 and 8 apply today; the others are covered on days 5–10.

### 1. Steering long sessions

- Scope the work with plan mode and read the plan closely: fixing a plan is cheaper than cleaning
  up after a bad run.
- Always give `/compact` instructions, e.g. `/compact Focus on the --version flag implementation`.
- Rewind (`Esc` twice with an empty prompt box): restore code, conversation or both; "Summarize from
  here" or "up to here".
- `/goal` when you can describe "done" better than the steps, e.g. `/goal all tests in src/billing
  pass, and the type checker reports zero errors`. Pitfall: the evaluator only reads the
  transcript, so the condition must be provable from the output.
- Parallel work: worktrees; `.worktreeinclude` copies git-ignored files (env, local config) into
  the worktree.

### 4. Permission modes

- Six modes: Manual, Accept edits, Plan, Auto, Don't ask (anything that would ask is denied; for
  CI), Bypass (only in a container or VM).
- Auto blocks deploys, migrations, force pushes and sending sensitive data out; it allows edits in
  the project and pushes to your own branch.
- Pitfall: the classifier checks intent, not whether the code is correct; pair it with a Stop hook
  that runs the tests.

### 8. Trust it: verifying unsupervised runs

- Unattended runs use Auto, not Bypass.
- Read the diff before the summary: `/code-review`, then `git diff`; check the files in the plan
  first, then look for changes outside the plan. A tidy summary can hide a touched file.
- Tests are a gate (Stop hook), not a promise. Have a new session or subagent review. For headless
  runs, check the JSON result and the exit code.

### Later days

- **2. A CLAUDE.md that is followed** (day 5): guidance, not configuration; the longer the file,
  the weaker each rule. Hard rules ("never push to main") become hooks. Pitfall: `@file` imports
  do not save context.
- **3. Verification skills** (day 7): a skill that runs when work is done: tests, diff, no
  weakened tests, pass or fail with evidence. CLAUDE.md holds conventions, skills hold procedures,
  hooks hold what must not be skipped.
- **5. Hooks** (day 9): PreToolUse (block), PostToolUse (format, lint), Stop (keep going),
  SessionStart. PreToolUse returns allow, deny or ask; `updatedInput` rewrites the whole input.
  Pitfall: exit 1 does not block.
- **6. Routines and headless** (day 9): a routine is a prompt, a repo and connectors, run in the
  cloud on a schedule, an HTTP POST or a GitHub event. Pitfall: at most once an hour.
- **7. GitHub Actions and Code Review** (days 9–10): Code Review comments inline by severity but
  does not approve, block or push fixes; `anthropics/claude-code-action@v1` acts in CI. The
  training repo is on GitLab, so the concept is enough.
- **9. Plugins** (day 7): skills, subagents, hooks and MCP in one versioned install. Pitfall: a
  plugin runs code with your permissions; read it first and install only from trusted sources.

### Self-check

1. Does a PreToolUse hook that exits with code 1 block the command? No, only exit 2 blocks.
2. Does Auto mode catch wrong code? No, the classifier checks intent; add a Stop hook that runs the
   tests.
3. Can a routine run every 15 minutes? No, at most once an hour.

### Sources

- [Claude Code in action](https://academy.claude.com/courses/claude-code-in-action)

## Skills of the day

- **Plan mode:** in the CLI press `Shift+Tab` until the indicator shows plan (`Alt+M` on Windows
  terminals where that fails); in Desktop use the mode picker or `Ctrl+Shift+M`.
- **One topic per session, and resume:** start a fresh session per topic; reopen an old one from
  the sidebar, with `/resume` inside a session, or `claude --resume` in the terminal.
