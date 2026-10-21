# Day 01 exercise: prompt log

Three real work questions (a bug summary, explaining a concept, a drafting task). At least two
prompt versions per question. No customer data.

## Template

```text
Question: [bug summary / explain a concept / drafting]
Prompt v1: ...
What was wrong with v1: [generic, wrong, missing, too long, wrong tone...]
What I changed: [added context / gave the why / added examples / set output format / asked for assumptions...]
Prompt v2: ...
Why v2 is better: ...
How I verified the result: [read the code / ran it / asked a teammate / official docs]
4D competency used: [Delegation / Description / Discernment / Diligence]
```

## Sample v1 → v2

| Question | v1 | v2 |
|---|---|---|
| Bug summary | "Summarize this ticket" | "Here is a ticket [paste]. Summarize in 3 sentences: what it asks, what is ambiguous, the first step. Then list the assumptions you are making and missing info (environment, repro steps, expected vs actual)." |
| Explain a concept | "Explain git rebase" | "I've used git merge but never rebase. Explain how rebase differs from merge with a 3-commit example, when not to use it, and two common misconceptions. Under 300 words." |
| Drafting | "Write a PR description" | "Write a PR description for this change [paste diff]. Structure: What, Why, How tested, Screenshots (empty if no UI). Reader is a reviewer who hasn't seen the ticket. Concise, no hype." |

## My log

Real prompts from the Claude Code session that set up this repo (2026-10-20). The originals
were in Vietnamese; they are translated here.

### Q1: bug summary

```text
Question: summarize a task description (Day 2 of the training plan) into a to-do list
Prompt v1: "[artifact link] Look through Day 2, list the tasks and the preparation needed,
  and explain simply what each task requires."
What was wrong with v1: Claude assumed the team setup of the plan (a lead, a partner, a real
  backlog, a GitLab repo). Half of the list did not apply to me.
What I changed: added context and constraints: I learn alone, there are no tickets, no
  GitHub repo yet; then answered its questions (Developer track, Claude writes the tickets
  with title, description and acceptance criteria).
Prompt v2: "I am learning this plan alone and have no tickets yet. 1. Developer track
  2. [...] 3. Claude writes the tickets: title, description and acceptance criteria
  4. No GitHub repo yet. What else do you need me to answer?"
Why v2 is better: the summary became a solo plan (Claude plays partner and reporter) and
  listed only what I really have to prepare: a practice app, tickets, a seeded bug.
How I verified the result: compared each task with the Day 2 section of the source plan.
4D competency used: Description (context and constraints), Discernment (spotted the wrong
  assumption).
```

### Q2: explain a concept

```text
Question: why does the training need a practice app, and for how long?
Prompt v1: "So I need an app? What for? [...] 5. I don't understand."
What was wrong with v1: too vague. The answer explained sandboxes in general and did not
  help me decide between an existing repo and a new one.
What I changed: named the two options and the trade-off I care about (time), and asked about
  the rest of the program, not only Day 2.
Prompt v2: "Is building an app from scratch necessary, or would an existing repo save time?
  Do the later days keep building on the app, or only focus on learning Claude?"
Why v2 is better: the answer compared the options (my LangGraph repo needs paid API keys,
  holds real secrets and has no tests) and showed that Days 3-15 all run on the same app
  (fix, PR, worktrees, skills, hooks, review, capstone).
How I verified the result: checked the day-by-day schedule in the plan; opened the other
  repos myself.
4D competency used: Delegation (deciding what Claude builds and what I learn),
  Description.
```

### Q3: drafting

```text
Question: draft the docs/ layout for notes and exercises
Prompt v1: "About the docs/ structure: suggest a sensible layout, since there are notes,
  exercises, per-day items and more."
What was wrong with v1: no constraints, so the draft was over-built: a README in every day
  folder, plan and checklist files, a separate knowledge/ folder, then one file per topic.
What I changed: said exactly what I want and what I don't, with the reason (the root README
  is already the plan overview).
Prompt v2: "Why a README inside each day? The root README is the plan overview. No plan or
  checklist, no separate knowledge/ folder: put the knowledge of each day in that day's
  folder, in one file."
Why v2 is better: one result, matching what I use: docs/lessons/day-XX-<slug>/knowledge.md
  plus exercise-*.md.
How I verified the result: read the new tree and files; Claude ran a link and anchor check.
4D competency used: Description (output format), Discernment (rejected drafts),
  Diligence (I own the final structure).
```

## Discussion

- Where AI surprised me (good): it built a full working app (API, dashboard, 26 tests) and
  verified it in the browser pane instead of only saying it works.
- Where AI surprised me (bad, confidently wrong): the first run looked done, but the API
  listened on the wrong port because the preview tool sets `PORT`; the dashboard returned 502
  until the variable was renamed `API_PORT`. It also kept adding structure I had not asked
  for until I gave explicit constraints.
