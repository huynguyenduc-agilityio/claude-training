# Exercise: plugin evaluation (typescript-lsp)

Day 7 asks to browse the marketplace, install one useful plugin and evaluate it honestly. I chose
`typescript-lsp@claude-plugins-official` 1.0.0, user scope, and used it on EXP-108.

## Setup

| Step | Result |
|---|---|
| Install the language server | `npm install -g typescript-language-server typescript`: server 5.3.0 on `PATH` |
| Install the plugin | `claude plugin install typescript-lsp@claude-plugins-official --scope user` |
| Components | 1 LSP server (`typescript`); no skills, agents, hooks or MCP servers |
| Context cost | `Always-on: ~0 tok` (the server runs out of process) |

## What happened

1. **First run failed.** A `hover` request returned "Could not find a valid TypeScript
   installation". This repo uses `typescript` 7.0.2 (`app/server/package.json`), the Go port,
   which ships no `lib/tsserver.js`. The global `typescript` installed next to the server was also
   7.0.2. The server needs `tsserver.js`, so it exited on start.
2. **Fix:** `npm install -g typescript@6.0.3`, the last version with `tsserver.js`. The repo keeps
   TypeScript 7 for `pnpm typecheck`.
3. **Diagnostics:** a scratch file with a misspelled field (`cachedInputToken`) and a wrong return
   type. Right after the edit, without running `tsc`, the server pushed:
   - `Type 'number' is not assignable to type 'string'. [2322]`
   - `Property 'cachedInputTokens' is missing ... [2345]`
4. **Navigation:** `findReferences` on `calculateCost` returned 13 references across 6 files,
   with no matches in comments or strings.
5. **EXP-108:** the fix and five tests were type-clean, so no diagnostics appeared. The plugin
   stayed quiet when there was nothing to report.

## Verdict

| Aspect | Rating | Why |
|---|---|---|
| Value on this repo | Medium | Small codebase and `pnpm typecheck` is fast; the gain is catching a typo at the edit instead of at the end |
| Setup | Poor | Needs a global binary and, with TypeScript 7, a second global TypeScript; the plugin gives no hint when the server fails |
| Context cost | Excellent | ~0 always-on tokens |
| Noise | Good | Silent on clean code |
| Accuracy | Good, with a caveat | It checks with TypeScript 6 rules while the repo builds with 7; rare differences are possible, so `pnpm typecheck` stays the final check |

**Keep it installed:** it costs nothing in context, and `findReferences` alone is better than
`grep` for "who calls this". Revisit when `typescript-language-server` or the plugin supports
the TypeScript 7 native language server.

## Other plugins looked at

| Plugin | Decision |
|---|---|
| `hookify` | Not now; consider on day 11 for the required hook |
| `claude-md-management` | Useful later, not urgent |
| `security-guidance` | Skipped: a hook on every turn adds noise |
| `pr-review-toolkit` | Skipped: overlaps the built-in `/code-review` |
| `commit-commands` | Skipped: built for GitHub (`gh`); this repo is on GitLab |
| `gitlab` (MCP) | Skipped: duplicates `glab` and adds context cost |
