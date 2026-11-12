---
name: ticket-pack-writer
description: Turns a rough client request into a ticket pack (user story, numbered Given/When/Then criteria, scope, non-scope, open questions) plus a spec and a QA test matrix, and measures it with the zero-questions test. Use when the user says "write a ticket pack", "turn this request into tickets", "BA intake", "run the zero-questions test", or pastes a vague feature request from a client.
argument-hint: [slug]
---

# Ticket pack writer

The BA's product is a ticket a developer can start on without a meeting. This skill writes one from a
rough request and proves it with the zero-questions test. It writes documents only, never feature code.

## Hard rules

- The client decides. Never answer a client question yourself, even when the answer looks obvious.
  Ask, then stop and wait. A choice the client did not make is an open question or a labelled BA
  proposal, never a silent default.
- Never edit `brief.md` after it is written: it is the client's words.
- Read the code before asking. A question the code answers is not a client question.
- Never commit, push or open an MR unless the user asks. Never read or print `.env` files.
- Repo files are in English. Follow the user's language in chat.

## Files

`$ARGUMENTS` is the feature slug, for example `project-budgets`. If it is empty, ask for one.

| File | Holds |
|---|---|
| `docs/capstone/<slug>/brief.md` | The request verbatim, who sent it, when (starts the 90-minute clock) |
| `docs/capstone/<slug>/intake.md` | Actors, constraints, what exists today with file references, numbered questions, the client's answers |
| `docs/tickets/EXP-1XX.md` | One ticket each, next free id; add a row to `docs/tickets/README.md` with status `Open` |
| `docs/capstone/<slug>/spec.md` | Numbered requirements R1…, design, how each client answer is met, parallel streams, areas of concern with an owner |
| `docs/capstone/<slug>/zero-questions.md` | Score and decisions for every round |
| `docs/capstone/<slug>/test-matrix.md` | QA cases from the criteria |

The repo is the source of truth. A spec artifact, if published, shows `spec.md` and links back to it.

## Steps

1. **Brief.** Write `brief.md` from the user's message, verbatim, with the time it arrived.
2. **Intake.** Read the code that the request touches. Write `intake.md`: what the client asked for,
   actors, constraints from the brief and from the repo, what exists today with file paths, then
   numbered questions. Each question ends with *Why:* one sentence on what changes in the build
   depending on the answer. Stop and wait for the client.
3. **Answers.** Record the answers as a table in `intake.md`. Answers often raise new questions or
   contradict each other; ask a second round the same way. List what is left to the BA as proposals
   the client confirms in review.
4. **Tickets.** One ticket per independent piece a user or an API caller can tell apart. Split so that
   tickets touch different files where possible; when two must share a file, say which goes first.
   Each ticket has:
   - Type, Priority, Reporter, Spec link, Depends on.
   - Description with the user story: "As a …, I want …, so that …".
   - Acceptance criteria as numbered Gherkin scenarios, 3 to 5 steps each. `Given` sets state,
     `When` is one action, `Then` is observable from outside (a response, a screen), never a database
     row. Use `Scenario Outline` with `Examples` for data variations and boundaries.
   - "More rules" for what scenarios cannot carry: exact texts, order, precision, error order.
   - Scope, Non-scope, Open questions, and "Repro (filled in by the developer)".
5. **Spec.** Write `spec.md` with numbered requirements, the API contract or screen design that lets
   streams work in parallel, a table mapping every client answer to requirements, and areas of concern.
6. **Zero-questions test.** Start a fresh subagent with no chat context. It reads only the tickets, the
   spec and the code, never `brief.md`, `intake.md`, `zero-questions.md` or `test-matrix.md`, edits
   nothing, and lists every question it would have to ask, each marked BLOCKING (two reasonable
   developers would build something a user or caller can tell apart) or MINOR. Internal choices that
   nobody outside can see (names, file layout, table schema, test setup) do not count; they belong in
   the developer's plan.
7. **Triage.** Check each question against the code before acting on it. Sort the answers into client
   decisions (visible behaviour, texts) and lead decisions (technical). Propose an answer for each, ask
   the user, and record the decisions in `zero-questions.md`. Fold them into the tickets and spec.
8. **Repeat** steps 6 and 7 with a new subagent each round until a round has no BLOCKING question.
   MINOR questions left over go to a table for the developers' plans.
9. **Test matrix.** From the criteria only: one row per case with ID, criterion, type (happy, edge,
   negative, permission or data variation), given, action, expected. Every criterion has at least one
   row. Add the plan: scope, environments, data, failure injection, what is not tested, risks. A
   criterion that cannot be tested as written goes back to step 4. The QA owner reviews it.

## Gotchas

- Fluent text hides undecided choices. Every rule must trace to the brief, a client answer, or a
  labelled proposal the client approved.
- Each round goes one level deeper (round 1: what is shown; later rounds: float precision, error
  order, what the existing framework does). Expect 3 to 5 rounds and check claims against the code.
- Name exact texts, orders and precisions. "Sorted by name" needs an order; "the percentage" needs a
  rounding; "reload" needs to say what stays on the screen.
- The subagent is the same kind of model as the writer and may share its blind spots. The build is
  the stronger test.

## Output

After each step, report in chat: the files written, the questions for the client (the decision only,
with options), and for step 6 the line `BLOCKING: n, MINOR: m` with the round number. Stop at every
point where the client or the lead decides.
