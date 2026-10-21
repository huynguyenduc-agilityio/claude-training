# Day 01: mental model and Claude basics

## Claude 101: lessons 1–4 (Meet Claude)

Course: <https://academy.claude.com/courses/claude-101> · 13 lessons · about 2.5 hours · 1 quiz and a badge.

**Core idea:** use Claude as a thinking colleague. Write prompts as set the stage, define the task,
specify rules; treat the first answer as a draft; organize work with Projects, Artifacts, Skills
and Connectors.

Lessons 5–13 are in [Day 02](../day-02-ticket-analysis/knowledge.md#claude-101-lessons-513).

### 1. What is Claude?

- Role: thinking partner for personal and work tasks, not just a Q&A chatbot.
- Trained with Constitutional AI: avoids harmful or discriminatory output, refuses illegal or
  unethical tasks.
- **Steerability:** you can adjust personality, tone and behavior.
- Capabilities: writing and editing; research and document analysis (200K+ token context, about
  500 pages, up to 1M tokens on paid plans with supported models); coding; Thinking mode
  (step-by-step reasoning before answering); Learning mode (guides you to reason yourself).
- Surfaces: claude.ai, desktop and mobile apps, Claude Code, Claude in Slack, Claude Design,
  Claude for Microsoft 365. Signed in, conversations, projects, memory and settings sync.

### 2. Your first conversation

| Part | Contains | Example |
|---|---|---|
| Set the stage | Your role, goal, background | "I'm a backend dev on a Node API, preparing a bug fix for review" |
| Define the task | The action: write, analyze, build | "Summarize this ticket and list what is missing" |
| Specify rules | Style, tone, format, length, examples | "3 sentences, then a bullet list of open questions, no guesses about the cause" |

- **Add context:** upload PDF, DOCX, CSV, TXT, PNG, JPEG. Claude reads text, images and charts.
- **Tools:** web search for fresh data; Google Drive and other sources.
- **Model choice:** Opus for the hardest work, Sonnet as the daily default; turn off extended
  thinking for simple tasks. Changing model starts a new chat.
- **Iterate:** follow up, say what works and what doesn't, edit and resend (pencil icon), or
  start a new chat to reset context.
- **Personalize:** Settings → Account → "Instructions for Claude"; Memory (view, edit, delete in
  Settings); Skills for repeated workflows.

### 3. Getting better results

| Problem | Cause | Fix |
|---|---|---|
| Too generic | Missing context | Add audience, role, concrete constraints |
| Too long / too short | Claude had to guess length | State it: "two paragraphs", "under 100 words" |
| Wrong format | Understood the task, not the shape | Give a template or describe the structure |
| Confident but wrong | Plausible errors, especially niche facts | Verify key facts, ask for sources or confidence, use web search |
| Wrong tone | Default tone is professional and helpful | Describe the tone or paste a sample of your writing |

- **Iteration mindset:** the first answer is a draft. Specific feedback ("drop the first two
  paragraphs") beats vague feedback ("make it shorter").
- **4D Framework:** Delegation, Description, Discernment, Diligence. See [AI Fluency](#ai-fluency-the-4d-framework).
- **Small eval:** (1) collect 5–10 examples of a task you do often; (2) write a test prompt with
  the context you normally have; (3) compare: key info present? tone right? what is missing?;
  (4) adjust the prompt, add good examples, mark where a human check is mandatory.
- Lesson example: a manager tested Claude on last quarter's data where he knew the answer. Claude
  found the main correlation but missed a detail until asked to split by program type, and it
  guessed when data was missing. He still owned the final report.

### 4. Working on your desktop

| Kind of work | Tab | Fits |
|---|---|---|
| Turn-by-turn | Chat | Brainstorming, drafting, editing, quick questions; your judgment at each turn matters most |
| Hand off whole tasks | Cowork | Multi-step work, finished files, several tools, recurring tasks |
| Building software | Code | Read, write and test code, run commands in a codebase |

- **Cowork:** local folders, scheduled tasks (run even when the computer is off, except tasks
  needing local files), subagents, Claude in Chrome, computer use (asks per app), plugins.
  Asks before consequential actions such as sending email.
- **Code:** Local mode (chosen folder, dev server preview) and Cloud mode (GitHub repo, keeps
  running when the app is closed); visual diff, terminal, git rollback, approval modes
  (manual, accept edits, plan).
- Lesson exercise: find recent requests that were really one whole task split into many small
  questions; write the outcome you want instead of the first question.

### Self-check

1. Three parts of a good prompt? Set the stage, define the task, specify rules.
2. Claude states a wrong number confidently. What does lesson 3 say? Verify key facts, ask for
   sources or confidence, turn on web search.
3. Summarize 50 documents in a folder into a memo: Chat or Cowork? Cowork.

---

## AI Fluency: the 4D Framework

Course: AI Fluency: Framework & Foundations
(<https://academy.claude.com/courses/ai-fluency-framework-foundations>) · 14 lessons · about 4 hours.

AI Fluency = working with AI in a way that is effective, efficient, ethical and safe.

### Three modes of working with AI

| Mode | Meaning | Dev example |
|---|---|---|
| Automation | AI does a specific task you specify | "Write unit tests for this function" |
| Augmentation | You and AI think and build together | Discussing API design options with Claude |
| Agency | AI acts on your behalf; you shape its knowledge and behavior | Claude Code running until tests pass; a scheduled Cowork task |

Claude Code and Cowork are mostly Agency, so Discernment and Diligence matter even more.

### Delegation: what goes to AI, what stays with you

| Component | Definition | Question to ask |
|---|---|---|
| Problem awareness | Understand the goal and nature of the work before bringing AI in | What does a good result look like? |
| Platform awareness | Know what each AI system can and cannot do | Chat, Cowork or Code? Does it have web search, can it read the repo? |
| Task delegation | Split work so people and AI each play to their strengths | Which parts need human expertise and judgment? |

The goal is the best collaboration for each task, not automating everything.

Delegation plan template:

```text
Project: ...
Success looks like: ...
Why it matters: ...

| Task | Skills needed | Human part | AI-suited part | High-impact collaboration | Decision: Me / AI / Together |
|------|---------------|------------|----------------|---------------------------|------------------------------|
```

### Description: communicate clearly

| Component | Definition | Example line in a prompt |
|---|---|---|
| Product description | What to produce: output, format, audience, style | "Write a PR description with What/Why/How tested for a reviewer who hasn't seen the ticket" |
| Process description | How to approach the request | "Read the diff first, list assumptions, then write" |
| Performance description | How to behave while collaborating | "Push back directly if my approach looks risky" |

Six prompting techniques: give context (what, why, background) · show examples · specify
constraints (format, length) · break complex tasks into steps · ask the AI to think first ·
define the AI's role or tone. Bonus: ask the AI to improve your prompt.

### Discernment: judge what AI produces

| Component | Evaluates | Check |
|---|---|---|
| Product discernment | Output quality | Accuracy, appropriateness, coherence, relevance |
| Process discernment | How the AI got there | Logic errors, analysis gaps, lapses in attention, bad reasoning |
| Performance discernment | AI behavior while working | Did it answer the question, take feedback, use clear language |

Description states intent; Discernment checks whether the result meets it. Your domain knowledge
is what lets you judge quality.

### Description–Discernment loop

1. **Describe:** product, process, performance.
2. **Discern:** evaluate the output, the approach and the behavior.
3. **Refine:** feedback on what works and what doesn't, adjust the description, retry.
4. **Integrate:** add your expertise, decide keep/edit/drop, own the final result. Never delegated.

### Diligence: own AI-assisted work

| Component | Definition | In this program |
|---|---|---|
| Creation diligence | Choose AI systems and interactions thoughtfully | No secrets or customer data in AI; right tool for the job; don't accept the first output |
| Transparency diligence | Be honest about AI's role with those who need to know | Say which parts Claude drafted when relevant; review AI-assisted PRs to the same bar |
| Deployment diligence | Verify and vouch for output you use or share | Run tests, check sources before sending; never merge what you can't explain |

### Course exercises

1. **Delegation plan:** pick a small task; let Claude question you until success is clear; fill
   the template above.
2. **Bad prompt makeover:** ask Claude for some bad prompts, rewrite them using Product, Process,
   Performance; then swap roles.
3. **Expert discernment:** pick a topic you know well; ask for three explanations; grade them with
   the three kinds of Discernment; give specific feedback and ask for a better one.

### Self-check

1. "Push back if my approach looks risky" is which Description? Performance.
2. Right conclusion but a skipped reasoning step: which Discernment? Process.
3. Which loop step is never delegated? Integrate.
4. Checking Claude's numbers before sending to a client: which Diligence? Deployment.

---

## AI Capabilities and Limitations

Course: <https://academy.claude.com/courses/ai-capabilities-and-limitations> · about 3.5 hours.

### Four properties

Each property is a range from capability to limitation. Knowing where a task sits tells you how
much to trust the result (**calibrated trust**).

| Property | Strong at | Weak at | Mitigation |
|---|---|---|---|
| Next-token prediction | Familiar patterns: summarize, reformat, rewrite | Specific facts, numbers, names: where fabrication happens most | Verify every specific fact; ask for sources |
| Knowledge | Common, consistent topics | Rare, new, niche or contested topics; anything after the knowledge cutoff | Search, retrieval, tool use, or documents you provide |
| Working memory (context window) | Everything in the current session | Hard limit; the middle of long documents gets less attention; new sessions forget old ones | Front-load, chunk, restate key information |
| Steerability | Short, specific, checkable instructions | Long reasoning chains (drift), abstract requests, letter-over-spirit | Split the task, state the purpose, check each step |

- **Training stages:** pretraining builds a general text predictor; fine-tuning turns it into an
  assistant, with side effects: sycophancy, verbosity, over-caution, poorly calibrated confidence.
- **Property collision:** for example a very long document (working memory) that also needs recent
  knowledge. Find which property causes the error and fix that one.
- In Claude Code this is why `/clear`, a short `CLAUDE.md` and tests for self-checking exist.

### Self-check

1. Which property explains a confidently wrong version number of a niche library?
   Knowledge (niche, possibly after cutoff), combined with next-token prediction (specific facts).
2. A long session starts ignoring an instruction from the start. Which property? Working memory.
3. Claude follows the literal instruction but misses its purpose. Which property? Steerability
   (letter-over-spirit).

---

## Prompting principles

### Seven principles

| Principle | Instead of | Write |
|---|---|---|
| Be explicit | "add tests for foo.py" | "write tests for foo.py covering the logged-out case, no mocks" |
| Add context (why) | "NEVER use ellipses" | "this is read by text-to-speech, so don't use ellipses" |
| Point to sources | "why is this API weird?" | "read the git history of ExecutionFactory and summarize how its API came to be" |
| Reference existing patterns | "add a calendar widget" | "follow the pattern in HotDogWidget.php" |
| Use examples | Describing format in words | 3–5 varied examples wrapped in `<example>` tags |
| Control format positively | "don't use markdown" | "write in flowing paragraphs" |
| Provide verification criteria | "write an email validator" | "...tests: user@example.com valid, user@.com invalid; run the tests after writing" |

- Use XML tags to separate instructions, documents and examples. For long documents, put the
  document first and the question last; ask for relevant quotes before the answer.
- Chain prompts for big tasks: each step feeds the next, easier to debug than one huge prompt.
- Vague prompts help exploration: "what would you improve in this file?"
- For a large feature, let Claude interview you first, write `SPEC.md`, then implement in a fresh
  session (prompt in the [prompt library](../../reference/prompt-library.md)).

### Ground rules

- **Never paste secrets, passwords, tokens or customer data into any AI tool.**
- AI output is a proposal until you have verified it (run it, read the code, check the docs).
  Fluent wording is not evidence.
- The practice repo is a private sandbox, never client code.

### Self-check

1. Why give the reason behind a constraint? Claude generalizes to cases you didn't list instead of
   following the letter only.
2. Which principle turns "add a calendar widget" into a better prompt? Reference existing patterns.
3. How do you let Claude check its own work? Provide verification criteria, such as tests to run.

### Sources

- Prompting best practices: <https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices>
- Claude Code best practices: <https://code.claude.com/docs/en/best-practices>

---

## Git basics

```bash
git clone <repo-url>
git switch -c <type>/<short-description>   # one branch per ticket
git status
git add <file>
git commit -m "docs: add day 1 notes"
git push -u origin <branch>
```

- Branch name: `<type>/<short-description>`, for example `fix/exp-101-month-total`.
- Commit message: Conventional Commits, `type(scope): subject`, lowercase, no trailing period.
  Types: feat, fix, refactor, docs, chore, test.
- One logical change per commit.
