# Day 02 exercise (morning): ticket analysis

Source task (Dojo Day 02): *"take 5 real tickets from the training backlog. For each, write the
three-sentence analysis: what it asks, what's ambiguous, first step. Use Claude to find gaps and
draft clarifying questions; compare with a partner's analysis."*

Tickets: [docs/tickets/](../../tickets/README.md). Method: [knowledge.md](knowledge.md#ticket-analysis).

1. **My analysis:** write the three sentences yourself, without Claude.
2. **Claude review:** paste the ticket and your analysis into the "Ticket analysis" prompt from the
   [prompt library](../../reference/prompt-library.md). Claude returns a review (what's correct,
   gaps), clarifying questions (for BA/PM, and what to check in the code yourself) and a first step.
3. **Final analysis:**
   - **Three sentences:** your analysis corrected with the review.
   - **Questions to send:** the final list for BA/PM, each with a default assumption.
   - **Answered by the code:** facts you checked yourself, so you don't ask them. Write how the
     app behaves today, not the cause of a bug (that is the afternoon's work).

---

## EXP-101: Dashboard total doesn't match the usage records

### My analysis

- **What it asks:** The Finance team asks that the "Total cost" card, the "Requests" card and the
  budget percentage match the total and row count of the usage records table for the same month,
  because they copy these numbers into the monthly cost report.
- **What's ambiguous:** No month, date or environment is given (which month, which machine and config,
  local or seeded data), no actual numbers (card value vs table value), and "sometimes" is not
  explained: does it happen for every month or only some?
- **First step:** Run the app, open several months and write down card total vs table total and card
  requests vs row count, to find which months differ and by how much before asking the reporter.

### Claude review

#### Review

**What's correct**

- What it asks matches the three acceptance criteria (cost card, requests card, budget percentage).
- Measuring several months yourself before asking the reporter is the right first move.

**Gaps**

- Assumes the table total is the correct value; the ticket does not say which number matches the invoice.
- Does not ask when the difference was seen (one day or several) or whether it changes over time for the same month.
- Does not link the request count difference to the cost difference: same months or not?

#### Clarifying questions

**For BA/PM**

1. Which month(s) did you compare, and what were the card total and the table total? (Default: the current month.)
2. On which day and roughly what time did you look? (Default: today.)
3. Do you run the app with the default settings or changed ones? (Default: default settings.)
4. Is it the same for every month or only some months? (Default: only some.)
5. Which of the two numbers matches what you expect from the invoice? (Default: unknown; check both.)

**Check in the code yourself**

- Which endpoint feeds each number: `/api/summary` for the cards, `/api/usage` for the table.
- Whether the sample data shows the difference, and for which months.
- Browser and screen size: not relevant, both numbers come from the API.

#### First step

Run the app from scratch, compare card and table for every month in the data and note the numbers; then compare the `/api/summary` and `/api/usage` responses for one month that differs.

### Final analysis

#### Three sentences

- **What it asks:** The Finance team needs the "Total cost" card, the "Requests" card and the budget percentage to equal the usage records table total and row count for any month, because the numbers go into the monthly cost report.
- **What's ambiguous:** Which months differ and by how much, the reporter's environment, when the difference was seen, and which of the two values is the correct one.
- **First step:** Reproduce on a fresh run, record card vs table per month, compare the two API responses for a month that differs, then send the reporter questions in one batch.

#### Questions to send

1. Which month(s) did you compare, and what were the card total and the table total? (Default: the current month.)
2. On which day and roughly what time did you look? (Default: today.)
3. Do you run the app with the default settings or changed ones? (Default: default settings.)
4. Is it the same for every month or only some months? (Default: only some.)
5. Which of the two numbers matches what you expect from the invoice? (Default: unknown; check both.)

#### Answered by the code

- The cards come from `/api/summary`; the records table and the total under it come from `/api/usage`.
- Both numbers are computed by the server from the same records and the same price table; the browser only formats them.
- Browser and screen size do not affect the numbers, so there is no need to ask about them.

---

## EXP-102: Alert when monthly spending passes 80% of the budget

### My analysis

- **What it asks:** The engineering manager wants a warning banner when the current month's spending
  reaches 80% of the budget (red at 100%, showing spent, budget and percentage) and the team to be
  notified when 80% is crossed.
- **What's ambiguous:** "The team is notified" has no channel (email, Slack, in-app), no recipients and
  no frequency (once per month or on every page load); it is also unclear whether the banner shows
  only for the current month or for any selected month, and where the budget value comes from.
- **First step:** Check what the API already returns for the budget (the summary has a budget status)
  and ask the reporter how the team should be notified; build the banner first and treat the
  notification as a separate ticket if it needs an external service.

### Claude review

#### Review

**What's correct**

- What it asks matches the criteria.
- "The team is notified" is the main gap: no channel, recipients or frequency.

**Gaps**

- "Current month only or any month" is already answered: the criteria say "spending for the current month".
- "Where the budget comes from" is not a question for the reporter: it is in the code.
- Missing: the dashboard already has a budget card with an ok/warning/exceeded level; is the banner new or a change to that card?
- Missing: can the banner be closed, and does it come back after a refresh?

#### Clarifying questions

**For BA/PM**

1. How should the team be notified at 80%: email, Slack or only in the dashboard? (Default: dashboard only; a notification channel becomes a separate ticket.)
2. Who should receive it, and only once per month? (Default: once per month.)
3. Should the banner replace the budget card status or appear in addition to it? (Default: in addition, at the top.)
4. Can the user close the banner? (Default: no.)

**Check in the code yourself**

- Budget value: `MONTHLY_BUDGET_USD` in the server config (default 30).
- `budgetStatus` already returns `warning` from 80% and `exceeded` from 100%; `/api/summary` sends it to the dashboard.

#### First step

Confirm the notification scope with the PM; meanwhile build the banner from the `budget.level` that `/api/summary` already returns.

### Final analysis

#### Three sentences

- **What it asks:** The engineering manager wants a banner at the top of the dashboard when the current month reaches 80% of the budget (red at 100%, showing spent, budget and percentage) and the team notified when 80% is crossed.
- **What's ambiguous:** How, to whom and how often the team is notified, whether the banner replaces or adds to the budget card, and whether it can be closed.
- **First step:** Ask the PM about the notification; build the banner from the existing budget level and split the notification into its own ticket if it needs an external service.

#### Questions to send

1. How should the team be notified at 80%: email, Slack or only in the dashboard? (Default: dashboard only; a notification channel becomes a separate ticket.)
2. Who should receive it, and only once per month? (Default: once per month.)
3. Should the banner replace the budget card status or appear in addition to it? (Default: in addition, at the top.)
4. Can the user close the banner? (Default: no.)

#### Answered by the code

- The budget is `MONTHLY_BUDGET_USD` in the server config (default 30).
- `budgetStatus` already returns `warning` from 80% and `exceeded` from 100%, and `/api/summary` sends it to the dashboard.
- The dashboard already has a budget card that shows the level; there is no banner and no notification today.

---

## EXP-103: lyra-flash costs higher than the provider invoice

### My analysis

- **What it asks:** The Platform team asks to price lyra-flash at the new provider price ($0.20 input,
  $2.00 output per million tokens) from the date of the change, keep the old price for earlier
  usage, and leave other models unchanged.
- **What's ambiguous:** The date of the price change is missing, the cached input price is not mentioned
  (changed or not), and there is no invoice amount or period to check the result against; the
  current pricing table has one price per model, so "old price before the date" needs a design
  decision.
- **First step:** Ask the reporter for the effective date, the new cached input price and one invoice
  line to compare with; meanwhile read how `pricing.json` and `getPrice` work to see what must
  change.

### Claude review

#### Review

**What's correct**

- The missing effective date is the key gap.
- Seeing that the pricing table has one price per model, so keeping the old price needs a design change.

**Gaps**

- The cached input price is not mentioned: changed or still $0.03?
- No invoice line to check the result against.
- "How to keep the old price" is a design decision for the developer, not a question for the reporter.
- "Other models are not affected" is already in the criteria.

#### Clarifying questions

**For BA/PM**

1. From which date does the new price apply? (Default: the first day of the current month.)
2. Did the cached input price change too? (Default: unchanged at $0.03.)
3. Can you share one invoice line (period, tokens, amount) to check the result? (Default: check by hand from the price list.)

**Check in the code yourself**

- How `pricing.json` and `getPrice` are used by the cost calculation.
- Whether cost is computed when a record is read or stored with the record (decides whether old records keep the old price).

#### First step

Get the effective date and the cached price from the reporter; read `pricing.ts` and `cost.ts`, then write a plan for date-based prices.

### Final analysis

#### Three sentences

- **What it asks:** The Platform team wants lyra-flash priced at $0.20 input and $2.00 output per million tokens from the date of the price change, with older usage and other models unchanged.
- **What's ambiguous:** The effective date, the new cached input price, and an invoice line to verify against; how to store prices by date is a design decision.
- **First step:** Ask the reporter for the date, the cached price and one invoice line; read the pricing and cost code and plan date-based prices.

#### Questions to send

1. From which date does the new price apply? (Default: the first day of the current month.)
2. Did the cached input price change too? (Default: unchanged at $0.03.)
3. Can you share one invoice line (period, tokens, amount) to check the result? (Default: check by hand from the price list.)

#### Answered by the code

- `pricing.json` holds one price per model; lyra-flash is $0.30 input, $2.50 output, $0.03 cached input.
- Cost is not stored with a record: it is computed with the current price table every time records are read. Changing the price in `pricing.json` alone would also reprice old usage, so date-based prices are needed.

---

## EXP-104: Export a month of usage records to CSV

### My analysis

- **What it asks:** The Finance team wants an "Export CSV" button that downloads the selected month's
  usage records as `usage-YYYY-MM.csv`, one row per record with fixed columns, the cost column
  summing to the table total, and the button disabled when the month is empty.
- **What's ambiguous:** The value formats are not defined (time format, cost precision and currency
  symbol, empty cached tokens before the field existed), nor the column order and header names,
  separator and encoding, and whether the file is built in the browser or by the API; it also
  depends on the table total being right, which EXP-101 questions.
- **First step:** Agree on a sample file with the reporter (header plus two rows), and check EXP-101
  first, since "sum equals the table total" is only useful if that total is correct.

### Claude review

#### Review

**What's correct**

- Value formats are the main gap.
- The dependency on EXP-101: "sum equals the table total" only helps if that total is right.

**Gaps**

- Column order is already in the ticket; only the header names are missing.
- "Button disabled when there are no records" is already in the ticket.
- "Browser or API" is a design decision for the developer, not for the reporter.
- Missing: which spreadsheet tool opens the file (separator, encoding).

#### Clarifying questions

**For BA/PM**

1. Which spreadsheet tool do you open the file with? (Default: Excel, comma separator, UTF-8.)
2. How should cost be written: plain number with 4 decimals, or with a $ sign? (Default: plain number, 4 decimals.)
3. How should time be written? (Default: ISO 8601 as stored.)
4. What should an empty cached-token value be: blank or 0? (Default: blank.)

**Check in the code yourself**

- How the table formats time and cost today (`app/web/src/shared/format.ts`).
- Whether the records API already returns everything the file needs.

#### First step

Agree on a sample file with the reporter (header plus two rows) and link the ticket to EXP-101.

### Final analysis

#### Three sentences

- **What it asks:** The Finance team wants an "Export CSV" button that downloads the selected month's records as `usage-YYYY-MM.csv`, one row per record with the listed columns, the cost column summing to the table total, disabled when the month is empty.
- **What's ambiguous:** Header names and value formats (time, cost, empty cached tokens), separator and encoding for their spreadsheet tool; the total depends on EXP-101.
- **First step:** Agree on a sample file with the reporter and link the ticket to EXP-101 before building.

#### Questions to send

1. Which spreadsheet tool do you open the file with? (Default: Excel, comma separator, UTF-8.)
2. How should cost be written: plain number with 4 decimals, or with a $ sign? (Default: plain number, 4 decimals.)
3. How should time be written? (Default: ISO 8601 as stored.)
4. What should an empty cached-token value be: blank or 0? (Default: blank.)

#### Answered by the code

- `/api/usage?month=YYYY-MM` already returns each record with its cost and the month total.
- The table shows cost with 2 decimals and a $ sign, time as day, month and hour without the year, and empty cached tokens as `—`; the file needs its own formats.

---

## EXP-105: API accepts negative token counts

### My analysis

- **What it asks:** QA reports that `POST /api/usage` saves records with negative token counts, which
  lowers the month total; negative `inputTokens`, `outputTokens` and `cachedInputTokens` must be
  rejected with `400` and a message naming the field.
- **What's ambiguous:** The main case is clear, but the ticket does not say whether zero and non-integer
  values are valid, what the exact error message should be, or what to do with negative records
  already in the database.
- **First step:** Reproduce with the request from the ticket, then read `usage.validation.ts` and its
  test to see which checks exist; write a failing test for a negative value before changing
  anything.

### Claude review

#### Review

**What's correct**

- The main case is clear and comes with steps to reproduce.
- First step: reproduce, then write a failing test before changing code.

**Gaps**

- "Non-integer values" is not a question: the API already rejects them.
- "Exact error message" is already in the ticket ("a message naming the field"); the wording is up to the developer.
- Still missing: is 0 valid, and what happens to negative records already saved?

#### Clarifying questions

**For BA/PM**

1. Is 0 a valid token count? (Default: yes.)
2. Should negative records already in the database be removed or fixed? (Default: leave them; separate ticket.)

**Check in the code yourself**

- `requireInteger` already rejects non-integers with `must be an integer`.
- How `cachedInputTokens` is checked (it may be missing or `null`).

#### First step

Reproduce with the request from the ticket, then write a failing test in `usage.validation.test.ts` for a negative value.

### Final analysis

#### Three sentences

- **What it asks:** QA reports that `POST /api/usage` saves negative token counts; negative `inputTokens`, `outputTokens` and `cachedInputTokens` must be rejected with `400` and a message naming the field.
- **What's ambiguous:** Whether 0 is valid and what to do with negative records already saved.
- **First step:** Reproduce with the ticket's request and write a failing test for a negative value before changing the validation.

#### Questions to send

1. Is 0 a valid token count? (Default: yes.)
2. Should negative records already in the database be removed or fixed? (Default: leave them; separate ticket.)

#### Answered by the code

- `requireInteger` already rejects non-integers with `<field> must be an integer`.
- `cachedInputTokens` may be missing or `null`; otherwise it must be an integer.
- No check for values below zero exists for any of the three fields.

---

## Exercise: questions for the reporter

Ticket: EXP-101. Claude plays the reporter and only answers what the reporter knows.

### Questions (closed, ordered by importance)

1. Which month(s) did you compare, and what were the card total and the table total?
2. On which day and roughly what time did you look?
3. Do you run the app with the default settings or changed ones?
4. Is it the same for every month or only some months?
5. Which of the two numbers matches what you expect from the invoice?

### Role-play transcript

Claude played the Finance reporter (2026-10-21) and answered only what the reporter knows.

| # | My question | Reporter's answer | New fact learned |
|---|---|---|---|
| 1 | Which month(s) did you compare, and what were the card total and the table total? | September. The card said $24.58, the table said $24.84. Requests: card 346, table had 347 rows. | Real numbers: card is $0.26 lower and has one request less. |
| 2 | On which day and roughly what time did you look? | On 1 October in the morning, when I prepared the September report, and again today. Same numbers both times. | Not a timing or refresh issue: the difference is stable for a closed month. |
| 3 | Default settings or changed ones? | I never changed anything; IT installed it for us. We are in Ho Chi Minh City. | Default config; the team works in Vietnam. |
| 4 | Every month or only some? | I also checked August: card $37.15, table $36.86. October so far: card $14.86, table $14.90. | Every month differs, and the card is sometimes higher, sometimes lower. |
| 5 | Which number matches the invoice? | I don't know. We copy the card into the report; nobody compared it with the invoice line by line. | No ground truth from the reporter: the developer must decide which number is right. |

### Takeaways

- Question that unlocked the most important information: #4 (every month). It showed the
  difference is not a one-off and goes in both directions, so it is not rounding in one place.
- Question to add to the bug ticket template: "Which period did you look at, and what exact
  values did you see on each side?"
