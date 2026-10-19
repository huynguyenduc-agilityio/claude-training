# claude-training

Practice repo for the Agility IO **AI Tools – Training** program: 15 full-time working days that make Claude the core working tool for developers (web/game/mobile) and BA/QA staff.

- Source plan: <https://dojo.agilityio.dev/index.html>
- Claude Code docs: <https://code.claude.com/docs>
- Core tool: **Claude Desktop** with its **Chat**, **Cowork**, and **Code** tabs. Developers work mainly in the **Code** tab.

> The source site last verified feature and course names on 2026-10-07, and they change quickly. Re-check the source pages before each week.

---

## Program Shape

| Phase | Days | Content |
|---|---|---|
| Week 1: Shared fundamentals | 1–3 | Ticket analysis, reproduce, fix, PR, review, merge, git, and Claude habits |
| Weeks 2–3: Track split | 4–11 | Developer track (Claude Code Desktop) and BA/QA track in parallel |
| Capstone | 12–15 | A cross-functional sprint that exercises every skill |

Pass/fail checkpoints on **Days 3, 6, 11, and 15**.

### Day-by-Day Schedule (Developer track)

| Day | Topic | Key work | Checkpoint |
|---|---|---|---|
| 01 | Mental model + Claude basics | Claude 101 course; get useful answers to 3 real work questions; clone/branch/commit/push | |
| 02 | Ticket analysis, reproduce & understand | 3-sentence analysis of 5 tickets; reproduce a seeded bug; write a failing test; `pull --rebase`, merge conflict #1 | |
| 03 | Fix, review, merge | Fix on a branch with a test; write the PR description; review with ≥3 comments; resolve the conflict and merge | **CP1** |
| 04 | Install & daily loop | Set up the Code tab; sessions, `/resume`; permission modes; plan mode (Shift+Tab, or Alt+M on Windows); take 2 tickets to PR | |
| 05 | Memory & context | Write the team `CLAUDE.md`; auto memory, `/memory`, `/compact`; `/rewind` (Esc Esc) | |
| 06 | Flagship & parallel | PR walkthrough artifact; `/loop` + `loop.md`; Remote Control (`/rc`); `ultrathink` and `/effort`; `claude --worktree`; subagents; cloud session | **CP2** |
| 07 | Skills & plugins | 1 team skill + 1 personal slash command in `.claude/` (via PR); install and evaluate a plugin with `/plugin` | |
| 08 | MCP & connectors | Add GitHub MCP and Playwright MCP; use one MCP tool end-to-end | |
| 09 | Hooks & automation | 1 hook (format-on-edit / block-forbidden-command / notify-on-finish) via PR; `/goal`, scheduled tasks, routines, `@claude` in CI | |
| 10 | Review & quality | `/code-review`, `/code-review ultra`, `/security-review`; fix findings, get CI green, log false positives | |
| 11 | Role day | Playwright MCP; Web: Claude in Chrome + browser pane; Mobile: iOS Simulator; Game: computer use | **CP3** |
| 12 | Capstone: kickoff & planning | "Client" gives a rough brief; BA writes the ticket pack, QA the test matrix; developers ask questions only through tickets | |
| 13 | Capstone: build | One parallel session per ticket; plan mode first; one PR per ticket | |
| 14 | Capstone: test & harden | Regression and CI; `/loop` to watch the build; `/code-review` (ultrareview for auth/data changes) | |
| 15 | Review, merge, demo | Cross-review, tag a release, deploy; steer from a phone; retro; personal playbook | **Final** |

---

## Checkpoints

**Checkpoint 1 (Day 3), everyone**
- Reproduce an assigned bug and write the repro steps in the ticket
- Fix it on a branch with a test
- Open a PR with a self-contained description (what / why / how tested / screenshots)
- One peer review with ≥3 actionable comments, and one merge with a conflict resolved

**Checkpoint 2 (Day 6), Developer**
- Two parallel sessions (worktrees), both merged
- One plan-mode change steered through diff comments
- One artifact
- One Remote Control steer
- One `/loop` run

**Checkpoint 3 (Day 11), Developer**
- One skill and one hook merged
- One MCP tool used end-to-end
- One `/code-review` or ultrareview report acted on
- Role-day exercise done

**Final (Day 15)**
- Capstone shipped end-to-end (tagged release and deploy)
- Track skill bar demonstrated; Day 3, 6, and 11 checkpoints all passed

### Developer Track Skill Bar
1. Run two parallel isolated sessions on two tickets and merge both cleanly
2. Use plan mode for a risky change and steer it with diff comments
3. Publish an artifact that walks a teammate through your PR
4. Start a session at your desk and continue it from your phone with Remote Control
5. Run a `/loop` that babysits a PR through CI; run `/code-review` (or ultrareview) on a real branch
6. Ship one team skill (e.g. a release checklist) and one hook (e.g. format-on-edit)

---

## Daily Workflow: Ticket → Fix → PR

1. **Analyze**: paste the ticket and ask Claude to explore the codebase and find the likely bug location.
2. **Plan**: use plan mode, review the plan, then approve it.
3. **Fix**: implement on a branch, watch the diff pane, and steer with hunk comments.
4. **Verify**: Claude runs the tests and the app (browser pane for web, simulator for iOS).
5. **Ship**: open a PR with a description; the PR pane watches CI.
6. **Review**: `/code-review` as a first pass, then human review; ultrareview for risky changes.

**Habits**
- Give context (ticket, error, constraints), not just orders.
- One topic per session, one session per ticket.
- AI output is a proposal until you have run it.
- Never merge code you cannot explain.

### Code Review Checklist (Day 3)
Review in order: **Correctness → Tests → Readability → Security basics** (input handling, secrets, permissions) **→ Scope creep**. Comments must be actionable, with concrete guidance rather than verdicts.

---

## Safety Rails (Non-Negotiable)

- **Never** share client secrets or customer data with any AI tool.
- Don't put client code into cloud sessions or published artifacts unless the contract allows it. Ask the lead when unsure.
- Never let Claude push directly to shared branches on client repos; always go through a PR / MR.
- Configure `allow`/`deny` permission rules per tool; use sandboxed bash for untrusted commands and plan mode for anything destructive.
- Review AI-assisted PRs to the same standard as human PRs.

---

## Repo Layout (Planned)

```
claude-training/
├── README.md
├── CLAUDE.md                 # Day 5: build/run, conventions, "never do" list
├── loop.md                   # Day 6: maintenance prompt for /loop
├── .claude/
│   ├── skills/               # Day 7: release-checklist, how-we-write-migrations, review-checklist…
│   ├── commands/             # Day 7: personal slash commands
│   ├── agents/               # custom subagents
│   └── settings.json         # Day 9: hooks, allow/deny permissions
├── notes/
│   └── day-XX.md             # daily notes and results
└── playbook.md               # Day 15: one-page "How I work with Claude"
```

> **Note:** the source plan assumes GitHub (GitHub connector, GitHub Actions, `@claude`, `/install-github-app`), but this repo is hosted on internal GitLab (`gitlab.asoft-python.com`). Map those exercises to GitLab MRs / GitLab CI, or practice them on a separate GitHub repo.

---

## Courses

**Claude Academy** (free with a claude.ai sign-in)

| Course | When |
|---|---|
| [AI Fluency: Framework & foundations](https://academy.claude.com/courses/ai-fluency-framework-foundations) | Day 1 |
| [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations) | Day 1 |
| [Claude 101](https://academy.claude.com/courses/claude-101) | Days 1–2 |
| [Claude Code 101](https://academy.claude.com/courses/claude-code-101) | Day 4 |
| [Claude Code in action](https://academy.claude.com/courses/claude-code-in-action) | Day 4 |
| [Introduction to subagents](https://academy.claude.com/courses/introduction-to-subagents) | Day 6 |
| [Introduction to agent skills](https://academy.claude.com/courses/introduction-to-agent-skills) | Day 7 |
| [Introduction to Model Context Protocol](https://academy.claude.com/courses/introduction-to-model-context-protocol) | Day 8 |
| [AI-native SDLC playbook](https://academy.claude.com/courses/ai-native-sdlc-playbook) | Days 11–12 (leads/seniors) |
| [MCP advanced topics](https://academy.claude.com/courses/model-context-protocol-advanced-topics) | After the program |
| [Building with the Claude API](https://academy.claude.com/courses/building-with-the-claude-api) | After the program |
| [Claude Platform 101](https://academy.claude.com/courses/claude-platform-101) | After the program |

**Official docs**
- [Quickstart](https://code.claude.com/docs/en/quickstart) · [Desktop quickstart](https://code.claude.com/docs/en/desktop-quickstart) · [Common workflows](https://code.claude.com/docs/en/common-workflows) · [Best practices](https://code.claude.com/docs/en/best-practices)
- [Artifacts](https://code.claude.com/docs/en/artifacts) · [Chrome integration](https://code.claude.com/docs/en/chrome) · [Prompt library](https://code.claude.com/docs/en/prompt-library) · [What's new](https://code.claude.com/docs/en/whats-new/index)

---

## Quick Commands

```bash
claude --resume                                   # reopen an earlier session
claude --worktree ticket-123                      # isolated session on a git worktree
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

In a session: `/resume` · `/memory` · `/compact` · `/rewind` · `/loop 5m <task>` · `/rc` · `/effort` · `/plugin` · `/hooks` · `/goal` · `/code-review` · `/code-review ultra` · `/security-review` · `/mcp` · `/chrome`
