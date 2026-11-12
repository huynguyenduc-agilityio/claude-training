# Exercise: ticket pack for project budgets

Day 12 run on this repo, 2026-11-11 to 2026-11-12, by one person playing every role.

**Differences from the course:**

- **One person, several roles.** The user was the client and lead, and the BA and QA owner who
  approved the drafts. Claude drafted the BA and QA work. The developer was a fresh subagent with no
  chat context. The course has a team with a separate person in each role.
- **The brief was drafted by Claude and chosen by the user.** The course has the lead write it. Every
  answer to the BA's questions came from the user; Claude did not answer any of them.
- **Zero-questions without a human developer.** The course (Day 5) has a developer implement the pack.
  Day 12 writes no code, so a subagent listed its questions instead. Day 13's build is the real test.
- **Questions through the tickets, not in them.** The plan was to put the developer's questions in
  each ticket's Open questions section. They went into `zero-questions.md` instead, and the answers
  were folded into the criteria; each ticket's Open questions section names the rounds it absorbed.
- **From round 3, internal choices did not count.** Rounds 1 and 2 counted every question. Rounds 3 to
  5 told the agent that names, file layout, table schema and test setup belong in the plan.
- **Repo, not a Claude Project or Cowork.** The BA/QA track suggests a Project per client. The user
  chose the repo as the source of truth; the spec artifact is a view of `spec.md`.
- The course does not mention MRs, `/ship-ticket` or lessons; those follow the repo's conventions.

## The brief

Chosen from four drafts and stored verbatim in
[brief.md](../../capstone/project-budgets/brief.md): several teams share one budget, and at the end of
the month nobody knows which team went over. The client wants a budget per project and an early
warning. Received at 15:42.

## Intake

[intake.md](../../capstone/project-budgets/intake.md) lists what exists today (one company-wide
`MONTHLY_BUDGET_USD`, levels at 80% and 100%, per-project spending in `byProject`, project names as
free text) and asked 15 questions in two rounds. Each question ends with why the answer changes the
build. Round 2 came from the answers: "once per level" and "dashboard only" did not fit together.

Main answers: one team is one project; budgets are set on a dashboard form, accepting that the app has
no sign-in; a fixed amount per month; no budget means no warning; keep the company-wide budget; warn at
80% and 100%; dashboard only; inform, never block; current month only; one banner per project.

## The pack

| Ticket | Part | Stream on Day 13 |
|---|---|---|
| [EXP-112](../../tickets/EXP-112.md) | API and storage: `GET`, `PUT`, `DELETE /api/project-budgets` | Server |
| [EXP-113](../../tickets/EXP-113.md) | One banner per project | Web, first |
| [EXP-114](../../tickets/EXP-114.md) | "Project budgets" form | Web, after EXP-113 (both change `App.tsx`) |

[spec.md](../../capstone/project-budgets/spec.md) has R1 to R14, the API contract, a table mapping
each client answer to requirements, and five areas of concern. The spec artifact (private):
https://claude.ai/artifact/1JPZ9WjXMATw5CxXyD3izp

## Zero-questions rounds

Each round used a new Sonnet subagent that read the tickets, the spec and the code, and not the brief
or intake. Details and every decision are in
[zero-questions.md](../../capstone/project-budgets/zero-questions.md).

| Round | BLOCKING | MINOR | What the BLOCKING questions were about |
|---|---|---|---|
| 1 | 6 | 6 | Shown percent from a float ratio, 404 or 400 first, "$15.00" in a number field, reload losing "Saved", banner order, load failure |
| 2 | 5 | 7 | Float error at 80%, error precedence, sort order, malformed bodies, load error on past months |
| 3 | 3 | 7 | `express.json()` answers 500 for `null` and `5`; `1e-12` passed every rule as 0 cents; other rows after a save |
| 4 | 1 | 13 | Banners during the month's reload against `App.tsx` showing "Loading…" |
| 5 | 0 | 9 | Passed. MINOR questions left to the Day 13 plans |

Claims were checked against the code before acting on them. Round 3's `express.json()` claim was run
in a throwaway script and was right. Round 3's own tally said 2 BLOCKING but it marked 3.

**Skill bar, BA: missed.** The bar is a ticket pack from a raw request within 90 minutes. Round 3, at
17:32, was 110 minutes after the brief and still had BLOCKING questions. Rounds 4 and 5 ran after a
break, so the total wall-clock time is not the working time.

## Test matrix

[test-matrix.md](../../capstone/project-budgets/test-matrix.md): 31 API cases, 15 banner cases,
24 form cases and 2 accepted risks, each tied to a criterion, with a short test plan. The app has no
sign-in, so there are no permission cases; the one permission risk is accepted. The QA owner approved
it with no change.

**Skill bar, QA:** a reviewed test matrix from the acceptance criteria. Done.

## Skill

[ticket-pack-writer](../../../.claude/skills/ticket-pack-writer/SKILL.md), from Day 5's skill list,
written from what worked on this pack. It showed in the session's skill list without a restart. A
fresh Haiku agent picked it for four differently worded requests and not for a control request about
a failing test. It has not yet run end to end on a new request.

## Merge requests

| MR | Content | Checks |
|---|---|---|
| [!23](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/23) | Ticket pack, spec, matrix, zero-questions | `/ship-ticket`: only FAIL was "nothing committed yet"; 175 tests passed and clean type check on `187e49c` |
| [!24](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/24) | `ticket-pack-writer` skill | Same; 175 tests passed and clean type check on `7684a6d` |

The repo has no CI, so "green" means self-run tests plus GitLab's `mergeable` status.

## For Days 13 to 15

- Day 13 needs a web test runner for EXP-113 and EXP-114. Playwright is a new dependency and needs
  approval first.
- Day 14 asks for the suite in CI; the repo has no `.gitlab-ci.yml`.
- Day 15 asks for a tag and a deploy; there is no deploy target.
- The round 5 MINOR questions are listed in `zero-questions.md` for the plans.

## Answers to the self-check

1. A plan question if the app already formats money one way; a client question if it changes what
   people read. Here the pack fixed it as the API's `percent`.
2. The exercise measures how clear the request is. A correct guess still hides a decision nobody owns.
3. No. The agent can share the writer's blind spots. Day 13's build is the stronger proof.
4. A hook, plus the same check on the PR.
5. The intake holds the answers the tickets should carry. A developer who reads it would never find
   what the tickets miss.
