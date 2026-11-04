# Exercise: review signal

Day 10 asks for `/code-review` on a real branch, ultrareview on a seeded branch, a comparison of the
signal, and false positives noted for the retro: "Fix what the review found; PR green; note false
positives for the retro."

**Differences from the course:** a subagent built the seeded branch instead of the lead. GitLab has no
CI on this repo, so "PR green" became self-run `pnpm test` and `pnpm typecheck` plus GitLab's
`mergeable` status. That is not a green pipeline.

## Real branch: EXP-110

[EXP-110](../../tickets/EXP-110.md): `loadPricing` accepted an invalid `pricing.json` silently. Merged
in [MR !17](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/17) with
`Tests 175 passed (175)` and a clean type check on `main`.

`/code-review high` ran in the session that wrote the fix, so it was not independent. It gave 10
findings. `/security-review` reported no vulnerabilities.

| # | Finding | Decision | Note |
|---|---|---|---|
| 1 | Nonexistent dates pass (`2026-02-30` rolls over to March) | Fixed | Partly wrong: it also called `T24:00:00Z` a bug, though Node reads it as a valid time. The fix rejects it anyway |
| 2 | `{}` passes as a price table | Fixed | Outside the ticket's criteria, so a criterion was added |
| 3 | Duplicate period starts pass | Skipped | True, but the approved plan put it out of scope |
| 4 | Malformed JSON error does not name the file | Skipped | True, but the server still stops and no cost is wrong |
| 5 | The `Number.isFinite` branch has no test | Fixed | Removing the branch left all 49 tests passing |
| 6 | The `Date.parse` NaN branch has no test | Fixed | Same check; this branch guards the ticket's original bug |
| 7 | The test helper leaks temp directories | Fixed | 34 folders per run down to 1 |
| 8 | The `fail` helper is inconsistent and overbuilt | No change | Nitpick, and part of its reason was wrong: removing `return` breaks the type check |
| 9 | The regex allows more than millisecond precision | No code change | Nitpick: no wrong cost. The plan's wording was changed instead |
| 10 | The plan is out of date on the nonexistent-date test | Fixed | True, but its claim that `/ship-ticket` would catch this was wrong: that step only compares file lists |

No finding was wholly false. Three had a wrong detail or reason (1, 8, 10), and two were nitpicks (8, 9).

## Seeded branch

The branch added `GET /api/report/models` with 6 known bugs. It was named `feat/model-usage-report`
after the first name, `exercise/seeded-review`, gave the exercise away. A fresh session reviewed it,
the answer key stayed outside the repo, and the branch was deleted afterwards without being pushed.

| Measure | `/code-review high` | `/code-review ultra` |
|---|---|---|
| Seeded bugs found | 6 of 6 | 6 of 6 |
| Total findings | 10 | 10 |
| False behavior claims, run over HTTP | 0 | 0 |
| Real bugs beyond the key | 4 | 4 |
| Only this review | Test coverage; missing ticket id (caused by the exercise) | `db.prepare` on each request |
| Time | Not visible | Not visible; the dialog estimated 5 to 15 minutes |
| Cost | Normal usage | "Free ultrareview 1 of 3" |

Both ran inside one session of under 14 minutes.

| Seeded bug | Where | high | ultra |
|---|---|---|---|
| SQL injection through `model` | `usage.repository.ts:54` | #1 | #1 |
| Total summed from rounded costs | `report.ts:81` | #6 | #7, labeled nit |
| Day range ignores the time zone | `report.ts:36-39` | #3 | #3 |
| Date validation checks shape only | `report.routes.ts:20,24` | #7 | #5 |
| `totalPages` uses `Math.floor` | `report.ts:83` | #4 | #4 |
| Latest price, not the price in force | `report.ts:64` | #2 | #2 |

The extra bugs both found: a row with the model `constructor` gives a 500; unpriced rows count as cost
0; a repeated `model` parameter drops the filter; `to=9999-12-31` returns nothing.

**Weak signals:** ultra rated the rounded-total money bug `nit`. Its #9 and #10 were labeled `nit`
while their verification said `normal`, and some of its line numbers were off by 1 to 3. High's #10
is a fair reading of `CLAUDE.md`, but only the exercise caused it.

**Conclusion:** `/code-review high` for daily work; ultrareview for risky or large changes. On this
sample ultra found nothing more that mattered, at the price of a one-time free run. This is one
sample with few bugs, all written by Claude, so it does not show how either behaves on human code.

### Answer key

Each bug was confirmed by running it before the reviews.

1. **SQL injection.** `model=x' OR '1'='1` returns every model; `model=o'brien` gives a 500. Bind it
   with `AND model = ?`.
2. **Rounded total.** Three models at $0.004 each report `totalCost` 0; the correct value is 0.01. Sum
   first and round once.
3. **Time zone.** With `Asia/Ho_Chi_Minh`, a September report drops `2026-08-31T18:00Z` (local Sep 1)
   and includes `2026-09-30T20:00Z` (local Oct 1). Use local midnights.
4. **Date validation.** `from=2026-13-45&to=2026-13-46` gives a 500; `from=2026-02-30` rolls over to
   March. Return 400 using a round-trip check.
5. **Paging.** 3 models with `pageSize=20` give `totalPages` 0; 5 rows with `pageSize=2` give 2, not 3.
   Use `Math.ceil`.
6. **Price period.** `lyra-flash`, 1,000,000 input tokens on 2026-09-10: the report says 0.2; the
   correct cost is 0.3. Use `costOf`.

## Security plugins

**`security-guidance` 2.0.17.** Writing `eval(code)` to a test file gave the warning below after the
write, with no block. The file was then deleted and `git status` was clean.

```
eval() executes arbitrary code and is a major security risk.
```

The end-of-turn tier logged `Stop hook: empty review set` because the file was already gone, so **the
model tiers were not exercised**. `LLM review disabled or no API credentials` lines in the same log
came from another copy of the hook, and I first misread them as coming from this one.

**Claude Security 0.12.0.** `/claude-security scan commit 00d5b70 at low` took three attempts:

| Attempt | Result | Cause |
|---|---|---|
| Desktop session | Stopped, no scan | No `Workflow` tool |
| Terminal `claude` | Stopped, no scan | `python3` not found, and `Login expired · Please run /login` |
| Terminal `claude`, after the fixes | Scan finished | |

The fixes: `/login`, Dynamic workflows on in `/config`, and a temporary copy of `python.exe` named
`python3.exe` in the Python folder. That copy was deleted afterwards, and `PATH` never changed.

**Result:** 0 findings on 5 files and 334 lines, `duration_s: 38`. I checked the file list and line
count against `git show --stat`. `/security-review` also found nothing on this change. Limits:

- One researcher read the change and proposed nothing, so the panel cast no votes.
- The report's `verified` stamp therefore confirms no finding. No code was run.
- The memory-safety lens was skipped, judged from file extensions alone.
- A commit scan reports only what the commit touches, not the rest of the repo.
- There is no seeded security bug in this commit, so 0 findings does not show the scan can find one.

## review-checklist

The skill was tried once, with `claude -p "/review-checklist 54bb913" --model sonnet`, on the seeded
commit. It reported all five areas and found 4 of the 6 bugs: SQL injection, `Math.floor`, latest
price, and time zone. It missed the rounded total and the date validation. The run's reply says the
skill tool call failed and it followed `SKILL.md` by hand, so that run does not prove the slash
command works. Model and effort differ from the runs above, so 4 of 6 is not a fair comparison.

## False positives for the retro

- **No claim was simply false,** on either branch. This differs from Day 9, where two of nine were.
- **A wrong detail or reason on EXP-110:** finding 1 on `T24:00:00Z`, finding 8's reason, and finding 10's
  claim about `/ship-ticket`. The same session also judged them, so these verdicts are not independent.
- **Labels and line numbers from ultra** were sometimes wrong, even where the finding was right.
- **Caused by the exercise:** high's #10, the missing ticket id.

## What I learned

- A known answer key turns "seems better" into a count.
- Run a review in a fresh session. The session that wrote the fix also judged its review on EXP-110.
- `0 findings` and `verified` need reading: ask what was actually checked.
- A plugin can sit installed and still not work. Check each requirement, and run it.

## What I would do differently

- Reread the course before suggesting that a step be dropped. I recommended stopping the Claude
  Security scan when `python3` was missing, and the course lists that scan.
- Check how a plugin installs before telling someone to click. Add went to the account, not the repo.
- Read which copy of a hook wrote a log line before drawing a conclusion from it.
- Seed a security bug too, so the security tools have something to find.
