# Prompt library

Reusable prompts collected across the program. Add a prompt when it worked well twice.

## Ticket analysis: review my analysis (Day 2)

```text
I'm the developer about to pick up the ticket below. Here is my analysis:
[paste your 3 sentences]

Ticket:
[paste ticket]

Review my analysis in this structure:
1. Review
   - What's correct in my analysis.
   - Gaps: where it is wrong or incomplete, implicit assumptions, missing information
     (environment, steps, expected vs actual, data, attachments, related tickets).
     Say when a gap is already answered by the ticket.
2. Clarifying questions
   - For BA/PM: 3-5 closed questions ordered by importance, each with a default assumption.
   - Check in the code yourself: what I can find out without asking anyone.
3. First step: one concrete action I can take now.
Do not guess the cause of the bug.
```

## Debugging: hypotheses with a way to verify each (Day 2)

```text
I'm debugging the bug below in [language/framework].
Repro steps: ...
Expected: ...   Actual: ...
Stack trace / log (verbatim):
[paste]
Relevant code:
[paste the function or file, or name the files in Claude Code]

Give 3 hypotheses about the cause, ranked by likelihood.
For each: why you think so, and one concrete way to verify it
(command to run, log to add, input to try). Don't propose a fix yet.
```

## Failing test from a repro (Day 2)

```text
Here is the bug repro: [paste]. Here is an existing test in the same module: [paste].
Write one test in the same style that describes the correct (expected) behavior, using the
repro input. It must fail on the current code because of the assertion, not because of setup.
Don't change production code.
```

## Interview me before building (Day 1)

```text
I want to build [short description]. Interview me in detail using the AskUserQuestion tool.
Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs.
Don't ask obvious questions, dig into the hard parts I might not have considered.
Keep interviewing until we've covered everything, then write a complete spec to SPEC.md.
```
