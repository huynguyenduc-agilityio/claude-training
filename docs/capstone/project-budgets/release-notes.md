# Release notes: budgets per project

For: the budget owner and the team leads who use the AI Usage & Cost Tracker.
Date: 2026-11-16. Not yet tagged or deployed; that is the next step.
Artifact view (private until shared): https://claude.ai/artifact/XSkmJx6KeeLvd43VWSCa8f

## What's new

You asked to know early which team is about to go over budget, instead of finding out at the end of
the month. Each project can now have its own monthly budget, and the dashboard warns you per project.

**Set a budget for each project.** A new "Project budgets" section on the dashboard lists every
project, what it has spent this month, and its budget. Type an amount and press Save; press Remove to
take a budget away. You see "Saved" or the reason an amount was not accepted. Budgets are kept when
the app restarts.

**See which project is near or over its budget.** On the current month, the dashboard shows one
banner per project that has used 80% or more of its budget, for example:

> Budget warning for code-review: $3.50 of $4.00 spent this month (87%).

> Budget exceeded for support-bot: $24.00 of $20.00 spent this month (120%).

Projects over budget come first, then the ones closest to their limit. Projects without a budget get
no banner. The banners only inform; nothing is blocked.

**The company-wide budget stays as it was.** Its banner still shows first, above the project banners.

## Good to know

- A budget is a fixed amount in US dollars per month, from $0.01 to $1,000,000, with at most two
  decimals.
- "This month" follows the app's time zone, as the rest of the dashboard does.
- Anyone who can open the dashboard can change budgets, because the app has no sign-in. You accepted
  this when the feature was planned.
- Project names `.` and `..` can no longer be used for new usage records, because no budget could be
  saved for them. Other names with dots, such as `a.b`, still work.

## Fixed since the first build

A review of the finished work found four rare cases, now fixed:

- Projects with unusual characters in their names are now always listed in the same order.
- A project named like a built-in word, such as `constructor`, can now save its budget.
- Two projects with almost the same share of a very large budget are now ordered correctly.
- The `.` and `..` names above.

## How it was checked

- 398 automated tests run on every change, now also in continuous integration.
- A full manual pass on 2026-11-16 found no regression in the existing dashboard: totals, months,
  CSV export and adding a usage record all work as before.

## Changes included

| Merge request | Change |
|---|---|
| [!27](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/27) | Store project budgets and report each project's status (EXP-112) |
| [!26](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/26) | One banner per project near or over its budget (EXP-113) |
| [!28](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/28) | Set and remove project budgets from the dashboard (EXP-114) |
| [!31](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/31) | Fixes from the review (EXP-115) |

Internal only, no change for users: continuous integration (!30) and the training notes (!29).
