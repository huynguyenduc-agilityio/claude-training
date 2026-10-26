# Day 05: memory, context and sessions

Course: [Day 05](https://dojo.agilityio.dev/schedule/day-05.html), Developer track. No required
course or docs; the notes below come from the official docs and from running each exercise.

## CLAUDE.md and auto memory

Every session starts with an empty context. Two mechanisms carry knowledge across sessions, and
both are context, not enforced configuration: to block an action for sure, use a hook.

| | CLAUDE.md | Auto memory |
|---|---|---|
| Who writes it | You | Claude |
| Where | `./CLAUDE.md`, `~/.claude/CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/` | `~/.claude/projects/<project>/memory/` (`MEMORY.md` index plus one file per memory) |
| Loaded | Whole file at every session start | First 200 lines or 25KB of `MEMORY.md`; topic files on demand |
| Shared | Team, through git | This machine only; all worktrees of the repo |

- **Load order:** every `CLAUDE.md` and `CLAUDE.local.md` from the working directory up to the root
  is concatenated, not overridden; files closer to the working directory are read last. A
  `CLAUDE.md` in a subdirectory loads only when Claude reads or edits a file there. Rules in
  `.claude/rules/` with `paths` frontmatter load only for matching files.
- **When to add a line:** Claude makes the same mistake twice, a review catches something Claude
  should have known, or you type the same correction again. A multi-step procedure belongs in a
  skill, a rule for one area in a path-scoped rule, a rule that must always hold in a hook.
- **Write rules to be followed:** concrete and checkable, one per line, name the alternative when
  you forbid something. Keep the file on one screen; two conflicting rules make Claude pick one.
- **Commands:** `/memory` lists the instruction files and opens the auto memory folder (toggle:
  `autoMemoryEnabled`); `/context` shows what is loaded; `/init` on an existing file only suggests
  improvements; `/doctor prompt-audit` finds stale or conflicting instructions.
- **Say where it goes:** "remember that…" writes auto memory; "add this to CLAUDE.md" edits the file.
- **Pitfall:** commit and PR rules in CLAUDE.md compete with Claude Code's built-in git guidance.
  Set the `attribution` setting instead of relying on CLAUDE.md alone.

## Checkpoints and /rewind

- Every prompt that starts a turn creates a checkpoint; the last 100 are kept, saved with the
  conversation, so `/rewind` works after resume. Snapshots are cleaned up after about 30 days.
- Open the menu with `/rewind`, or `Esc` twice with an empty prompt box (with text in the box,
  `Esc Esc` only clears it). Options: Restore code and conversation, Restore conversation, Restore
  code, Summarize from here, Summarize up to here, Never mind.
- **Not restored:** files changed only by shell commands, edits from outside Claude Code or other
  sessions, most subagent edits, symlinked or hard-linked files. Rewind is quick undo inside a
  session, not version control.

## Compaction

- Run `/compact <focus>` before a long new task; `/autocompact 500k` compacts earlier;
  Summarize from or up to here compresses part of the conversation.
- **Survives:** system prompt, root `CLAUDE.md` and unscoped rules, auto memory, the plan-mode
  plan, skill descriptions (all re-injected). **Reloads on demand:** nested `CLAUDE.md`, path-scoped
  rules. **Partly:** up to 5 recently used files are re-read; the rest of the conversation becomes
  a summary.
- Anything said only in chat may or may not survive the summary; put lasting rules in CLAUDE.md.

## What I did and saw

- **CLAUDE.md review** ([MR !5](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/5)):
  52 lines with a `Never` list; fixed the stale `pricing.json` line (after EXP-103), added the
  GitLab/`glab` line and the commit and MR conventions, made the test rule say what is allowed
  (fixture shape changes need approval), and turned "Never push" into "Commit or push without
  being asked". Added `.claude/settings.json` with empty `attribution`; Claude Code switched its
  own guidance to "no attribution lines" in the running session.
- **New-session check:** a fresh session answered the push rule, the test rule and "does
  `pnpm test` touch `data/usage.db`?" without reading any file: two from CLAUDE.md, one from the
  `MEMORY.md` index line of a memory saved minutes earlier.
- **Compaction:** after reading 17 files, Messages went from 20,046 to about 9,000 tokens. The
  CLAUDE.md test rule and the list of files read (named in the `/compact` focus) survived; the
  first line of `cost.ts` did not (only 5 files were re-read in full). The chat-only convention
  "end every answer with `-- checked`" happened to survive in the summary, which the docs do not
  promise.
- **Rewind:** a rename across 4 files plus `echo test > scratch.txt`; Restore code and conversation
  brought the 4 files back, `scratch.txt` stayed and had to be deleted by hand.
- **Slash commands:** `/compact`, `/context` and `Esc Esc` work only when typed by the user in that
  session; a message from another session arrives as plain text.
- **Context exercise:** see [exercise-context.md](exercise-context.md).

## Self-check

1. A rule disappeared after `/compact`. Why? It was given only in chat, or it lives in a nested
   CLAUDE.md or path-scoped rule that has not reloaded. Put it in the root CLAUDE.md.
2. Claude deleted a file with `rm`. Can `/rewind` bring it back? No; use git.
3. Where does "remember that tests use an in-memory database" go? Auto memory, in
   `~/.claude/projects/<project>/memory/`, with a line in `MEMORY.md`.

## Sources

- [Memory](https://code.claude.com/docs/en/memory)
- [Checkpointing](https://code.claude.com/docs/en/checkpointing)
- [Context window](https://code.claude.com/docs/en/context-window)
