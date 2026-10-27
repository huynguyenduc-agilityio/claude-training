# EXP-102: Alert when monthly spending passes 80% of the budget

## Goal

Warn the engineering manager before the AI budget runs out:

- Dashboard shows a banner at the top for the **current month** when spending reaches 80% of
  `MONTHLY_BUDGET_USD` (amber), and a red "budget exceeded" banner at 100%. The banner states
  amount spent, budget and percentage.
- When a new usage record pushes the current month from below 80% to 80% or more, and again
  when one pushes it to 100% or more, the server notifies the team: a log line, plus a JSON
  `POST` to `BUDGET_ALERT_WEBHOOK_URL` when set.

Decisions:

- Thresholds are inclusive (80% → warning, 100% → exceeded), as in the existing `budgetStatus`.
- No budget set (`0`) → no banner, no notification (existing `level: 'ok'`).
- Percentage is rounded down (`Math.floor`), so 99.6% shows "99%" and never "100%" on an amber
  banner.
- Banner only when the selected month is the current month. The server decides: `GET
  /api/summary` returns `isCurrentMonth` (`month === currentMonthKey(config.timeZone)`, i.e.
  `APP_TIMEZONE`), so the banner never disagrees with the server's month when the browser is in
  another time zone. The web app uses it instead of `thisMonth()`. Past months keep only the
  existing budget card colour.
- Banner sits right under the header, above the cards; not dismissible.
- Notification fires at the 80% crossing and again at the 100% crossing, each once: the level
  rises (`ok` to `warning`, `warning` to `exceeded`, or `ok` to `exceeded`) because of one
  insert. Stateless (before/after comparison), so no new table. A jump from below 80% straight
  past 100% notifies once with level `exceeded`. Inserts that keep the same level, or lower it,
  notify nothing.
- The status after an insert is computed from the new record's cost added to the status before
  (`roundCents(before.spent + cost)`), so one insert scans the table once, not twice.
- Only inserts into the current month (server time zone) notify; backfilled records do not.
- Webhook is fire-and-forget: a failed webhook is logged and never fails `POST /api/usage`.
  Uses built-in `fetch`, no new dependency. The request aborts after 5 s
  (`AbortSignal.timeout(WEBHOOK_TIMEOUT_MS)`) so a slow endpoint cannot leave requests hanging;
  a timeout is logged like any other failure.
- New config field `budgetAlertWebhookUrl` is optional, so existing `AppConfig` test fixtures stay
  unchanged.
- Out of scope: email/Slack integrations, alert history, re-notify after budget change.

## Steps

0. Add `.claude/worktrees/` to `.gitignore`. Run `pnpm install`.
1. Failing unit tests `app/server/src/features/budget/budget.alert.test.ts`:
   - `crossesThreshold(before, after)`: ok→warning true, ok→exceeded true, warning→exceeded
     true, warning→warning false, ok→ok false, exceeded→exceeded false, any fall false.
   - `createBudgetNotifier({ webhookUrl, log, post })`: logs
     `Budget warning: $24.30 of $30.00 spent in 2026-10 (81%)`; posts
     `{ month, spent, budget, percent, level }` as JSON when `webhookUrl` is set; does not post
     when unset; the post init has an `AbortSignal` (`WEBHOOK_TIMEOUT_MS` = 5000); a rejected post
     or a timeout is caught and logged (`Budget webhook failed: <message>`).
2. Failing route test `app/server/src/features/budget/budget.alert.routes.test.ts` (new file, so
   EXP-104's work in `usage.routes.test.ts` does not conflict). In-memory app as in
   `summary.routes.test.ts`, budget 30, fake `notifyBudget` spy, records timestamped now:
   - insert below 80% → no call;
   - insert crossing 80% → one call with current month and status `warning`;
   - another insert that stays in the warning range → no further call;
   - a later insert crossing 100% → a second call with level `exceeded`;
   - one insert from below 80% past 100% → one call with level `exceeded`;
   - one `POST` calls `repository.listAll` exactly once;
   - insert crossing 80% in a past month → no call.
3. Implement `app/server/src/features/budget/budget.alert.ts`:
   - `crossesThreshold`, `WEBHOOK_TIMEOUT_MS`, `createBudgetNotifier`, and
     `createBudgetAlert({ repository, pricing, config, notify })` with `track(insert)`: computes
     the current month's `budgetStatus` before `insert()` (reuse `summarizeMonth` from
     `summary/summary.ts`, `currentMonthKey`/`toMonthKey` from `shared/time.ts`); after it, adds
     the record's cost (`calculateCost`, `getPrice`, `roundCents`) to the spent amount instead of
     scanning again; calls `notify` on a crossing.
4. Wire it:
   - `config.ts`: `budgetAlertWebhookUrl?: string` from `BUDGET_ALERT_WEBHOOK_URL`.
   - `app.ts`: optional dep `notifyBudget`; build the alert and pass it to the usage router.
   - `usage.routes.ts`: wrap only the insert in `POST /` with `budgetAlert.track(...)` (one-line
     change, keeps the EXP-104 overlap small).
   - `index.ts`: pass `createBudgetNotifier({ webhookUrl: config.budgetAlertWebhookUrl })`.
   - `app/server/.env.example`: add commented `BUDGET_ALERT_WEBHOOK_URL=`.
   - `summary.routes.ts`: add `isCurrentMonth` to the `GET /api/summary` response, with new tests
     in `summary.routes.test.ts` (current month → true, `2026-09` → false).
5. Web banner:
   - New `app/web/src/features/summary/BudgetBanner.tsx`: renders nothing at `ok`; otherwise
     `role="alert"` with "Budget warning: $24.30 of $30.00 spent this month (81%)" or
     "Budget exceeded: $31.20 of $30.00 spent this month (104%)", using `formatUsd`.
   - `shared/api.ts`: add `isCurrentMonth: boolean` to `MonthlySummary`.
   - `App.tsx`: render `<BudgetBanner>` above `<SummaryCards>` when
     `state.summary.isCurrentMonth` (`thisMonth()` stays only for the initial month).
   - `styles.css`: `.banner`, `.banner-warning`, `.banner-exceeded` using existing `--warning`
     and `--exceeded` colours.
6. Run `pnpm test` and `pnpm typecheck`.

## Files to change

- `.gitignore`
- `docs/plans/EXP-102-budget-alert.md` (new)
- `app/server/src/features/budget/budget.alert.ts` (new)
- `app/server/src/features/budget/budget.alert.test.ts` (new)
- `app/server/src/features/budget/budget.alert.routes.test.ts` (new)
- `app/server/src/config.ts`, `app/server/src/app.ts`, `app/server/src/index.ts`
- `app/server/src/features/usage/usage.routes.ts`
- `app/server/src/features/summary/summary.routes.ts`, `summary.routes.test.ts` (new cases only)
- `app/server/.env.example`
- `app/web/src/features/summary/BudgetBanner.tsx` (new)
- `app/web/src/App.tsx`, `app/web/src/shared/api.ts`, `app/web/src/styles.css`

## How to verify

- `pnpm test`: new tests fail before steps 3–4 and pass after; existing tests unchanged and pass.
- `pnpm typecheck` passes for server and web.
- Manual, `pnpm dev` with a temporary `MONTHLY_BUDGET_USD` per case (set in the shell, not in
  `.env`): budget so spend is ~79% → no banner; ~85% → amber banner with amount, budget, %;
  ≥ 100% → red "Budget exceeded" banner; pick a past month → no banner.
- Manual notification: run a local listener (e.g. `node -e` HTTP server on port 4100), set
  `BUDGET_ALERT_WEBHOOK_URL=http://localhost:4100`, `POST /api/usage` a record that crosses 80%;
  expect one log line and one JSON request; a second `POST` that stays below 100% sends nothing,
  and one that crosses 100% sends a second request with level `exceeded`.
