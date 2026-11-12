# Intake: project budgets

Source: [brief.md](brief.md). Written by the BA from the brief and the code on `main` at `04a21d3`.
Nothing below is decided until the client answers.

## What the client asked for

- Each project has its own budget.
- The client learns early when a project is about to go over its budget.
- Today the client can see only that the total went over, not which team caused it.

## Actors

| Actor | In the brief | Still unknown |
|---|---|---|
| The client (budget owner) | Wants per-project budgets and early warning | Whether they also set the budgets |
| Teams | Share one budget today | Whether a team and a project are the same thing (Q1) |
| Whoever sets budgets | Not mentioned | Who it is and where they do it (Q2) |

## Constraints

From the brief: none stated.

From the repo:

- The app has no sign-in and no roles. Anyone who opens the dashboard has the same rights.
- Money is in USD. Months follow the configured time zone, `Asia/Ho_Chi_Minh` by default.
- `CLAUDE.md`: no new dependency without approval; tests first.

## What exists today

- **One budget for everything:** `monthlyBudgetUsd`, from the `MONTHLY_BUDGET_USD` environment
  variable, default `30` (`app/server/src/config.ts`). It can only change with a server restart.
- **Levels:** `ok`, `warning` from 80%, `exceeded` from 100% (`app/server/src/features/budget/budget.ts`).
- **Alert on insert:** when a new record raises the current month's level, the server logs one line
  and, if `BUDGET_ALERT_WEBHOOK_URL` is set, posts to it. Only the current month counts
  (`budget.alert.ts`, from EXP-102).
- **Dashboard:** a banner shows the warning or exceeded state for the current month only
  (`app/web/src/features/summary/BudgetBanner.tsx`).
- **Per-project spending already exists:** `GET /api/summary` returns `byProject`, the cost and
  record count per project for a month (`summary.ts`).
- **Projects are free text** on each usage record, with no list of projects. The seed data has
  `support-bot`, `code-review` and `docs-search`. A new name appears as soon as a record uses it.

## Questions for the client

Each question says why the answer changes what gets built.

1. **Team or project?** The brief says teams overspend and asks for project budgets. Is one team
   the same as one project in the app, or can a team own several projects?
   *Why:* if a team owns several projects, the budget belongs to the team and the app needs a way to
   group projects.
2. **Who sets a project's budget, and where?** For example on the dashboard, in a settings file, or
   by asking a developer.
   *Why:* a dashboard form needs a new screen and a save API; a file or environment variable does not.
   The app has no sign-in, so a form would let anyone change any budget.
3. **How is the amount set?** One amount in USD per month that stays the same each month, or a
   different amount for each month?
   *Why:* it decides whether a budget is stored once per project or once per project per month.
4. **What about a project with no budget?** New project names appear whenever a record uses them.
   Should such a project have no budget and no warning, use a default amount, or be shown as
   "no budget set"?
   *Why:* without an answer, a new project can spend without any warning, which is the problem in
   the brief.
5. **What happens to today's company-wide budget of 30 USD?** Keep it next to the project budgets,
   replace it, or make it the sum of the project budgets?
   *Why:* it decides whether the current banner and alert stay, change or go.
6. **What does "early" mean?** The same points as today (80% and 100%), other percentages, and the
   same for every project or set per project?
   *Why:* it decides the warning levels and whether each project stores its own.
7. **How should you be told, and who else?** On the dashboard, through the existing notification
   (log line and optional webhook), or both? Only you, or the team of that project too?
   *Why:* the dashboard and the webhook are separate pieces of work, and the app has no contact
   details for teams.
8. **At 100%, inform only, or stop?** Should the app keep accepting usage for a project that is over
   its budget, or reject new records?
   *Why:* rejecting records changes the usage API and could stop a team's work.
9. **Which months?** Only the current month, as the banner does today, or also past months, for
   example to see at the end of the month which project went over?
   *Why:* the brief's problem is found at the end of the month; past months need the budget that
   applied in that month.
10. **How often to warn?** Once when a project crosses a level in a month, as today, or repeatedly
    while it stays over?
    *Why:* repeated warnings need a schedule or a rule about when to repeat.

## Client answers, round 1 (2026-11-11)

| # | Answer |
|---|---|
| 1 | One team is one project. A budget belongs to the project name on the usage records. |
| 2 | Set on a form on the dashboard. The client accepted that the app has no sign-in, so anyone who opens it can edit. |
| 3 | A fixed USD amount per month, kept until someone changes it. |
| 4 | A project with no budget has no budget and gets no warning. |
| 5 | Keep the company-wide budget and its banner next to the project budgets. |
| 6 | Warn at 80% and 100%, the same for every project. |
| 7 | Show it on the dashboard only, to the client only. No log line or webhook for projects. |
| 8 | At 100%, inform only. Usage records are still accepted. |
| 9 | Current month only. |
| 10 | Once per level per month. |

## Questions for the client, round 2

Raised by the round 1 answers.

11. **Where on the dashboard?** A banner per project at the top like today's, a status in the
    "by project" table, or both?
    *Why:* a banner per project can stack up; a table status changes the existing table.
12. **"Once per level" on a dashboard.** Answer 7 means no notification is sent. Should the dashboard
    show the state for as long as it lasts, or let you dismiss a warning so that it comes back only at
    the next level?
    *Why:* dismissing needs the app to remember what was dismissed.
13. **Removing a budget.** Can a project's budget be removed so that it has no budget again?
    *Why:* it decides whether the form needs a remove action.
14. **Which amounts are allowed?** Above 0 only, or is 0 allowed?
    *Why:* with 0, any spending is already over budget.
15. **Which projects does the form offer?** Projects that have records, any name typed in, or both?
    *Why:* typing a name allows a budget for a project before its first record, and also typos.

## Client answers, round 2 (2026-11-11)

| # | Answer |
|---|---|
| 11 | One banner per project at the top of the dashboard, like today's banner. |
| 12 | The dashboard shows the state for as long as it lasts. No dismiss. This replaces answer 10 for projects, since no notification is sent. |
| 13 | A budget can be removed; the project then has no budget again. |
| 14 | Amounts above 0 only, cents allowed. |
| 15 | The form offers projects that already have usage records. No typed names. |

## Left to the BA, confirmed by the client when approving the ticket pack

The client did not decide these. The ticket pack marks each one as a BA proposal so the client can
change it in review:

- Banner wording, which follows today's banner.
- Banner order when several projects are over a level.
- Where the budget form sits on the page.
- At most two decimals in an amount.

## Not asked

These come from the code, so they are not questions for the client:

- Spending per project is already computed by `summarizeMonth`.
- Costs come from `app/server/data/pricing.json`. Records without a price are not counted, and the
  dashboard already says how many there are.
