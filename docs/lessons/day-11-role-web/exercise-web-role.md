# Exercise: web role and Checkpoint 3

Day 11 asks the Web role to test the training web app from a session with Claude in Chrome (console
logs, form fill) and to run the browser pane app-preview loop. It lists Playwright MCP under "Skills
today".

**Differences from the course:**

- The app had no form to fill, so a new ticket added one: [EXP-111](../../tickets/EXP-111.md).
- `app/web` has no test runner and adding one is a new dependency. The first failing check was a
  recorded browser check, an exception to the failing-test step that the owner approved. The feature
  has no regression test.
- The extension went into a new empty Chrome profile, which the course does not ask for. It is removed
  at the end of the day.
- The repo has no CI, so "green" means self-run `pnpm test` and `pnpm typecheck` plus GitLab's
  `mergeable` status.

## The feature: EXP-111

Merged in [MR !21](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/21).
`/ship-ticket EXP-111` ran before the MR and gave one FAIL, check 3, because no test was added. That is
the approved exception. `Tests 175 passed (175)` and a clean type check ran on the pushed commit
`7fb1f64`.

Failing check before any code: `document.querySelectorAll('form').length` was `0`.

## The four submits

Values from the plan, on `http://localhost:5173`, in each browser:

| Submit | Network | On the page | Pane | Playwright | Chrome |
|---|---|---|---|---|---|
| `lyra-flash`, project `demo`, input 1000, cached blank, output 200 | `201` | `Record added to 2026-11.`; totals reload; token fields empty | Right | Right | Right |
| Input -1 | `400` | `inputTokens must not be negative`; values stay | Right | Right | Right |
| Cached 2000, input 1000 | `400` | `cachedInputTokens must not exceed inputTokens`; values stay | Right | Right | Right |
| Empty project | `400` | `project is required`; values stay | Right | Right | Right |

The browser pane alone also covered blank input, output and time; `1.5`; a record for another month;
375px width with no overflow; and the API process killed, which gives `Request failed: 502`.

## The browser pane loop

Three rounds. The Time input overflowed at 1024px, fixed with a 200px minimum column and `width: 100%`.
Then the inputs sat 2px apart after `align-items: end`, fixed with `height: 36px`. Tests could catch
neither.

## What went wrong

- **Wrong values in Chrome.** The first Chrome run used values other than the plan's, and I reported
  it as the same four submits. Reading the plan during `/ship-ticket` showed the mismatch, and the owner
  asked for a rerun. Same result, but only the rerun is the check the plan asked for.
- **A stale reading.** With every server stopped I read `Request failed: 502` and took it as the
  result. The button was still disabled: the request was pending and the text was the old error. The
  real outcome with no server was never seen, so a fetch rejection was tested only by stubbing
  `window.fetch` (`Failed to fetch`). The MR says so.
- **A hook block.** A `git diff --stat` with the pathspec `'*.env*'` was blocked by the `.env` rule,
  although it read no file. The pathspec was not needed: the skill's plain `--stat` already lists any
  `.env` file. Reported to the owner.

## Left as found

- An earlier error stays visible while a new request is pending. Minor.
- `favicon.ico` gives a 404 because `index.html` has no favicon link. Not from this ticket.
- `.playwright-mcp/` is not in `.gitignore`, as the Day 8 lesson already noted.

## Checkpoint 3

Checked against `main` on 2026-11-05.

| Item | Status | Evidence |
|---|---|---|
| One skill + one hook merged | Pass | Skill: [!10](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/10), [!18](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/18). Hook: [GitHub PR #2](https://github.com/huynguyenduc-agilityio/claude-training/pull/2), commit `7e70be0` in `origin/main` |
| One MCP tool used end-to-end | Pass | [!15](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/15), [GitHub PR #1](https://github.com/huynguyenduc-agilityio/claude-training/pull/1), lesson [!16](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/16) |
| One ultrareview-or-`/code-review` report acted on | Pass | [!17](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/17), commit `1a520ed`; decisions table in [!19](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/19) |
| Role-day exercise done | Pass | [!21](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/21) and this file |
