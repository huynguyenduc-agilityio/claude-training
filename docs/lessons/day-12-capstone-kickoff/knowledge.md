# Day 12: capstone kickoff and planning

Course: [Day 12](https://dojo.agilityio.dev/schedule/day-12.html), the first capstone day, for every
role. A "client" (the lead) briefs a feature vaguely on purpose. The BA runs intake, sends open
questions back, and writes a ticket pack and a spec artifact. QA drafts a test matrix from the
criteria. Developers ask questions only through the tickets. Leads finish the
[AI-native SDLC playbook](https://academy.claude.com/courses/ai-native-sdlc-playbook). The day's skill
is ticket-pack writing, judged by the zero-questions test. No feature code is written; Day 13 builds.

The point of the day: a ticket is done when a developer who knows nothing else can start without a
meeting. The zero-questions test turns that into a number.

## Roles

| Role | Does | Produces |
|---|---|---|
| Client / lead | Briefs roughly, answers questions, approves | The brief, every decision |
| BA | Extracts requirements, asks back, writes the pack | Intake, tickets, spec, spec artifact |
| QA | Turns criteria into cases | Test matrix |
| Developer | Reads only the tickets, asks through them | Questions; later, the plan and code |

## A ticket pack

- **User story:** "As a …, I want …, so that …".
- **Acceptance criteria** as numbered Gherkin scenarios. `Given` sets state, `When` is one action,
  `Then` is something a user or API caller can observe, never a database row. `Scenario Outline`
  with `Examples` carries boundaries and data variations.
- **Scope and non-scope.** Without non-scope a developer adds things or asks.
- **Open questions:** decisions the client has not made. They are never filled with a guess.
- **Spec:** numbered requirements (R1, R2 …) that plans and reviews can cite, the contract that lets
  streams work in parallel, and areas of concern with an owner.

## The zero-questions test

A developer who has seen nothing else reads the pack and lists every question they would have to
ask. If there is one, the pack is not done; the question shows what is missing.

- Count a question as BLOCKING when two reasonable developers would build something a user or caller
  can tell apart. Others are MINOR and go to the developer's plan.
- A question the code answers does not count. Neither does an internal choice nobody outside can see.
- Each round goes deeper. Here: round 1 asked what is shown; round 2 float precision and error order;
  round 3 what `express.json()` does with `null`; round 4 a conflict with how `App.tsx` reloads.
- A fresh subagent works as the developer, but it is the same kind of model as the writer and may
  share blind spots. The build on Day 13 is the stronger test.

## Choosing what goes where

| Situation | Choose |
|---|---|
| The client did not say, and two builds would differ | Ask the client; the ticket waits |
| Detail inside the code, invisible outside | Leave it to the developer's plan |
| The code answers it | Read the code; write the fact into the intake |
| A criterion QA cannot test as written | Back to the BA; QA does not rewrite it |
| Two tickets touch the same file | Run them one after the other, and say so in both |
| Spec and ticket disagree | Stop and ask the BA: it is a bug in the pack |

## AI-native SDLC playbook, for the lead

Fourteen lessons, about an hour, no quiz. Twelve plays across six stages: Plan, Design, Build, Test,
Deploy, Maintain. Humans stay accountable for every decision that needs judgment.

- **Six plays need nothing first:** capture `intent.md`, plan mode, `CLAUDE.md`, skills, the
  feedback loop, hooks as approval gates.
- **Intent to spec to plan:** the originator writes `intent.md` (problem, outcome, affected users and
  systems, constraints, open questions); Claude turns it into `spec.md` with numbered requirements and
  flagged concerns; the engineer iterates a plan in plan mode until someone who never saw the
  conversation could build from it, and commits it as `plan.md`. Today's `brief.md` and `spec.md`
  follow the same chain.
- **CLAUDE.md, skill or hook:** knowledge every session needs goes in `CLAUDE.md` (under a page; a
  mistake made twice goes in). Knowledge applied consistently for one kind of task goes in a skill.
  A rule that must always hold needs a hook, plus the same check on the PR.
- **One source of truth per artifact:** the repo, a legacy tool such as Jira, or at least a link both
  ways (record id in the file, commit SHA in the record).
- **Measures:** every play has a leading and a lagging indicator, read from Git or CI history, for
  example time from intent to spec, or spec commits after the first plan.
- **Later stages:** evals rerun on any change to `CLAUDE.md`, skills or hooks (never with `--bare`,
  which skips them); `REVIEW.md` for AI review, with approval still from a code owner; hooks that
  allow, ask or deny a release; the agent may act up to the production gate and not past it; a
  metric outside its control band becomes a new `intent.md`.

## Gotchas

- Fluent text hides undecided choices. Each rule must trace to the brief, a client answer, or a BA
  proposal the client approved.
- "Sorted by name", "the percentage", "reload" all need a definition: which order, which rounding,
  what stays on screen.
- Money near a threshold needs whole cents. In JavaScript `2.4 / 3` is `0.7999999999999999`, below
  the 0.8 warning level, and `0.29 * 100` is `28.999999999999996`, which rounds down to 28.
- The agent's own BLOCKING count can be wrong; count the marks, not its summary line.
- The block-forbidden hook stops any Bash command that contains `.env`, even a `grep` over
  `git status`. Report it; do not work around it.

## Self-check

1. A developer asks "how many decimals in the banner?". Client question or plan question?
2. Why may the BA not answer a question even when the answer looks obvious?
3. A round reports zero questions. Is the pack certainly good?
4. A rule must hold without exception. `CLAUDE.md`, skill or hook?
5. Why does the zero-questions developer not read `intake.md`?
