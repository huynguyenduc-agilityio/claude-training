# Day 02: ticket analysis, reproduce and understand

## Ticket analysis

### Three sentences

For any ticket, state in three sentences:

1. **What it asks**, and for whom.
2. **What is ambiguous** or missing: environment, steps, expected vs actual, data, attachments,
   related tickets.
3. **Your first step.**

Write your own three sentences before asking Claude, so you have a baseline to compare against.

### Using Claude to find gaps

- Paste the ticket together with your own analysis and ask for: where your analysis is wrong,
  the implicit assumptions, missing information by group, and 3–5 clarifying questions. Ask it
  not to guess the cause yet. Prompt in the [prompt library](../../reference/prompt-library.md).
- **Discernment:** mark each gap Claude lists as *really missing*, *already in the ticket*
  (Claude misread) or *not important*.
- Where two readings of the ticket differ (yours and Claude's, or a teammate's) is exactly where
  the ticket is ambiguous and needs a question to the reporter.

### Questions for the reporter

- Ask only what you cannot find out yourself by reading the code or running the app.
- Prefer closed questions that can be answered right away: "Which month were you looking at, and
  at what time?" rather than "What did you do?".
- Order them by importance and send them in one batch.
- Give a default assumption with each question so work is not blocked while waiting.
- The question that unlocked the most important fact belongs in the ticket template.

### Self-check

1. Claude lists a gap that the acceptance criteria already answer. What do you do? Mark it as
   already in the ticket and don't ask it; asking costs the reporter's time and your credibility.
2. Why write your own analysis before Claude's? To have a baseline and to notice what each side
   misses.

### Sources

- Shared Fundamentals: <https://dojo.agilityio.dev/fundamentals.html>
- Dojo Day 02: <https://dojo.agilityio.dev/schedule/day-02.html>

---

## Bug reports

### Ten principles

| Principle | Meaning |
|---|---|
| Make the failure visible | Show it happening, or give steps detailed enough to see it |
| Exact steps | Clicks, commands, inputs, files in order; a verbatim transcript is best |
| Facts vs guesses | Write the observed symptom; your diagnosis is optional and never replaces it |
| Expected vs actual | Say what is wrong and what you expected |
| Exact error messages | Copy them verbatim, numbers included |
| Freeze | When something odd happens, record it before poking around |
| Intermittency, environment | Frequency, preceding conditions, other machines |
| Versions | App, OS, runtime, relevant libraries |
| Check known issues | Look for duplicates, follow the project template |
| Precise writing | Specific, no vague pronouns, reread as the receiver |

### Minimal reproducible example

- **Minimal:** remove every step and piece of data that is not needed.
- **Complete:** enough for someone else to run.
- **Reproducible:** you tried it again and saw the failure.

### Reproduce-ready template

```text
Title: [wrong behavior] when [condition]

Environment: app commit …, OS …, browser/runtime …, data …, configuration …
Steps to reproduce:
  1. …
  2. …
  3. …
Expected: …
Actual: …            (paste exact numbers, error messages, responses)
Frequency: always | sometimes (x/10)
Layer (suspected): config | code | data — evidence: …
Evidence: screenshot, API response, link to failing test
```

A report is good when someone else reproduces the bug from it without asking anything.

### Sources

- Simon Tatham, How to Report Bugs Effectively: <https://www.chiark.greenend.org.uk/~sgtatham/bugs.html>

---

## Reproduce and debug

### Reproduce

1. **Clean clone:** clone the repo into a new folder and follow the README exactly. Any missing
   step is a documentation bug; record it.
2. **Follow the ticket.** If it doesn't reproduce, check environment, data and configuration,
   then ask the reporter.
3. **Classify the layer**, changing one thing at a time.
4. **Minimize:** remove steps and data until the smallest case that still fails remains.
5. **Write the repro into the ticket** and have someone else (or a fresh Claude session that only
   reads the ticket) follow it.

### Classify the layer

| Layer | Signs | How to narrow it |
|---|---|---|
| Config | Only on one machine or environment; fails at startup | Compare env vars, runtime versions, flags between failing and working setups |
| Code | Stable failure with the same input; stack trace points into project code | Failing test with the repro input; `git log -p`, `git bisect` |
| Data | Only for some records or accounts | Same steps with other data; find what is special about the failing records |

### Hypotheses, then verify by running

1. Give Claude the repro, expected vs actual, the exact error or numbers, and the relevant code.
2. Ask for 3 hypotheses ranked by likelihood, each with a concrete way to verify it, and no fix
   yet (prompt in the [prompt library](../../reference/prompt-library.md)).
3. Run each verification yourself and record the result.
4. Report wrong hypotheses back with the evidence so Claude can adjust.

Conclude only from results you ran, never from how confident the answer sounds. This is the
Description–Discernment loop applied to debugging.

### Debugging with Claude (official docs)

- **Describe the symptom**, the suspected location and what "fixed" looks like.
- **Give the repro command** and say whether it always or sometimes happens.
- **Address root causes, not symptoms:** "address the root cause, don't suppress the error".
- **Give Claude a way to verify:** a failing test is the best check; ask for evidence (test
  output, commands run).
- **Point to sources:** "read the git history of this module and summarize why it is like this".
- **Scope investigations:** an open-ended "investigate" reads hundreds of files; narrow it or use
  a subagent.

### Failing test

1. Find the test file closest to the faulty code and follow its style.
2. Write a test that describes the **correct** behavior, using the repro input.
3. Run it: it must **fail for the right reason**, an assertion about the behavior, not an import
   or setup error.
4. Name it after the behavior, not the ticket.
5. Commit it on the ticket branch; the fix makes it green.

### Self-check

1. Claude gives three convincing hypotheses. Next step? Run the verification of each and conclude
   only from the results.
2. Your failing test fails on an import error. Done? No. It must fail on an assertion about the
   wrong behavior.
3. A bug only happens on staging. Which layer first? Config, then data.

### Sources

- Claude Code best practices: <https://code.claude.com/docs/en/best-practices>
- Common workflows: <https://code.claude.com/docs/en/common-workflows>

---

## Git: rebase, history and conflicts

### Rebase

```bash
git pull --rebase                     # replay your commits on top of upstream, straight history
git rebase main                       # same idea against a local branch
```

On a conflict during a rebase:

```bash
git status                            # list conflicted files
# edit the files, remove the conflict markers
git add <file>
git rebase --continue
git rebase --abort                    # give up, back to the state before the rebase
```

Run the tests after resolving.

### Reading history

```bash
git log --oneline --graph -20         # quick look at history
git log -p -- path/to/file            # every change to one file
git log -S "functionName" --oneline   # commits that added or removed this string
git blame -L 40,60 path/to/file       # which commit wrote lines 40–60
git diff                              # unstaged changes
git diff --staged                     # staged changes
git diff main...HEAD                  # how your branch differs from main
```

### With Claude

- Paste `git log -p` output for the file around a bug and ask "which change most likely caused
  this behavior?".
- For a conflict, paste the conflicted hunk and ask Claude to explain what each side wants before
  you choose.

### Sources

- git pull: <https://git-scm.com/docs/git-pull>
- Pro Git, branching and merging: <https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging>

---

## Claude 101: lessons 5–13

Course: <https://academy.claude.com/courses/claude-101> · 13 lessons · about 2.5 hours · 1 quiz and a badge.

**Core idea:** use Claude as a thinking colleague. Write prompts as set the stage, define the task,
specify rules; treat the first answer as a draft; organize work with Projects, Artifacts, Skills
and Connectors.

Lessons 1–4 are in [Day 01](../day-01-mental-model/knowledge.md#claude-101-lessons-14-meet-claude). Take the quiz on the original course to get the badge.

### 5. Introduction to projects

- **Use a project when:** you keep referring to the same documents; you want consistent answers;
  several teammates need the same base.
- **Create:** Projects → + New Project → clear name; the description is for people only, Claude
  doesn't see it; private or shared in the organization.
- **Instructions:** context (what the project is for), process (for example outline before
  writing), tone and style, specific requirements. They apply to every chat in the project.
- **Knowledge:** PDF, DOCX, CSV, TXT, HTML or Google Drive. Use descriptive file names. Near the
  context limit Claude switches to RAG, extending capacity about 10x.
- **Note:** chats in a project don't remember each other, except what is in knowledge. Files
  attached to one chat are temporary.
- **Sharing (Team/Enterprise):** Can view, Can edit, Owner.
- **Best practice:** start narrow, keep documents fresh, write clear instructions, name the
  document in your question ("Based on the Q3 report, ...").

### 6. Creating with artifacts

- **Artifact:** a finished product (document, slides, design, dashboard, prototype) shown next to
  the chat. Ask for one explicitly to be sure you get it.
- **Specialized experiences (beta, paid plans):** Claude Design (landing pages, mockups,
  prototypes on a canvas), Claude Slides (from notes, present, export to PowerPoint or PDF),
  Claude Docs (co-editing, Claude explains via comments, export to Google Docs or .docx).
- **Artifact vs file:** an artifact opens and updates in Claude and is shared by link; a file is
  Word, Excel, PowerPoint or PDF for other apps.
- **Three ways to edit:** edit directly, comment on a part (in Docs you can @Claude), or ask in
  the conversation. Fix small typos yourself.
- **Sharing:** private until shared. Pro and Max: link sharing. Team and Enterprise: links inside
  the org; external sharing needs the Owner to enable it.
- **Best practice:** ask for a product, not just content ("a one-page brief for leadership");
  state inputs, outputs, features and end users; create the artifact late in the conversation,
  once Claude understands the problem.

### 7. Working with skills

| | Projects | Skills |
|---|---|---|
| Purpose | Store knowledge Claude refers to | Define a process Claude follows |
| Fits | Long-term context, reference documents, teamwork | Repeated multi-step workflows |
| Scope | Every chat in the project | Whenever the skill is used |

- **Two kinds:** Anthropic skills (Excel, Word, PowerPoint, PDF; trigger automatically) and
  custom skills (brand guidelines, meeting-notes format, compliance checklist).
- **Enable:** Settings → Capabilities → "Code execution and file creation" → Skills.
- **Create by conversation:** describe the skill in a new chat, answer Claude's questions about
  the task, what good looks like and when to use it, upload templates and examples, save.
- **Security:** install skills only from trusted sources and read them first; skills can contain
  executable code.
- **Combine:** the project gives information, the skill gives the process.

### 8. Connecting your tools

- A **connector** lets Claude work with your real data: find files, read documents, analyze,
  create, update records, within the permissions you grant. Built on MCP ("USB-C for AI").
- **Two kinds:** web connectors (Google Drive, Notion, Slack, Asana) and desktop extensions (run
  through Claude Desktop, access local files and apps).
- **Install:** claude.ai/directory or + in chat → Connectors → Connect → sign in → review
  permissions → test with "Can you access my [tool]?". Missing ones can be custom connectors.
- **Permissions:** each connector asks only for what it needs; Claude sees only what you see;
  revoke any time; treat custom connectors with the same care as skills.

### 9. Enterprise search

- Adds "Ask [Org name]" to the sidebar: a ready-made project over internal knowledge (SharePoint,
  Slack, Gmail, Google Drive...) that merges results into one cited answer.
- Admin setup needs one document source and one chat source.
- Returns only content you already have access to. Free, Pro and Max users can skip this lesson.

### 10. Research for deep dives

- Plans, searches in several rounds, synthesizes from the web and connected tools, cites every
  point. Takes minutes or longer. Enable via + → Research (web search must be on).

| Situation | Use |
|---|---|
| Multi-source report, competitor or vendor comparison, citations needed | Research |
| One quick fact, one or two sources enough | Web search |
| Math, debugging, logic with no outside data | Thinking |
| Internal company knowledge | Enterprise search |

- Good Research prompt: state the goal and the decision to make, give the report structure, add
  constraints (budget, time, region); you can ask Claude to refine the question first.

### 11. Use-cases by role

- Cross-role: status reports for stakeholders, patterns in customer feedback and surveys, brand
  standards packaged as a skill.
- Roles covered: Sales, Marketing, Finance, HR, Legal, Research. No dev, product, QA or BA
  examples; for those, this program's tracks are the reference.

### 12. Other ways to work with Claude

| Tool | Fits | Runs in |
|---|---|---|
| Claude.ai | General work, research, writing, analysis, files | Web, desktop, mobile |
| Claude Code | Software development, codebases, git, lint, merge conflicts, release notes | Terminal, IDE, browser |
| Claude Cowork | Multi-step work, research briefs, file organization, data analysis | Desktop (web and mobile in beta) |
| Claude Tag | Thread summaries, meeting prep, handing bugs or features to Claude Code | Slack |
| Claude Design | UI prototypes, comparing design directions, design systems | Web |
| Claude for Microsoft 365 | Excel, PowerPoint, Word, Outlook (beta) | Office sidebar |
| Claude in Chrome | Page summaries, repetitive forms, testing web features | Chrome sidebar |

Rule: use the tool where the work already happens. Claude in Chrome is a public beta: start with
low-risk tasks on trusted sites.

### 13. What's next?

- Start small with one recurring task this week; iterate in conversation instead of waiting for
  a perfect first answer; bring your judgment; skill comes from practice.
- Suggested next courses: AI Fluency, AI Capabilities and Limitations, Claude Code in Action,
  Introduction to Claude Cowork.

### Self-check

1. Do two chats in the same project remember each other? No, only project knowledge is shared.
2. Project vs skill in one sentence? A project stores knowledge, a skill runs a process.
3. You need a cited competitor comparison. Research or web search? Research.
