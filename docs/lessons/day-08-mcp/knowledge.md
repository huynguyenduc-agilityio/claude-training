# Day 08: MCP servers and connectors

Course: [Day 08](https://dojo.agilityio.dev/schedule/day-08.html), Developer track. Required
reading: the course [Introduction to model context protocol](https://academy.claude.com/courses/introduction-to-model-context-protocol)
(10 lessons, about 1 hour) and the docs on [MCP in Claude Code](https://code.claude.com/docs/en/mcp).
The day asks for the GitHub connector and the Playwright MCP server, and one MCP tool used end to
end in a session. The rest comes from running that on this repo.

## Model context protocol (course, 10 lessons)

- **What MCP is:** a protocol that moves the definition and execution of tools out of your app
  into MCP servers. Someone else (usually the service vendor) has already written the schemas and
  the functions for a large API such as GitHub.
- **MCP is not tool use.** Tool use is how Claude calls a tool; MCP answers who defines and runs
  that tool.
- **Client and server:** the client handles the protocol and the messages; the server is the
  interface to one outside service. Claude Code is an MCP client.
- **Transports:** stdio (server runs as a local process, most common), HTTP, WebSocket.
- **Two message pairs:** `ListToolsRequest`/`ListToolsResult` (what tools exist) and
  `CallToolRequest`/`CallToolResult` (run one tool with arguments).
- **Three primitives:**

  | Primitive | Controlled by | Use for |
  |---|---|---|
  | Tools | Model | Give Claude abilities it decides to use |
  | Resources | App | Put data into the UI or context (`@server:protocol://path` in Claude Code) |
  | Prompts | User | Predefined workflows (`/mcp__server__prompt` in Claude Code) |

- **Writing a server (lessons 3 to 9, for later):** Python SDK `FastMCP`, tools with
  `@mcp.tool`, resources with `@mcp.resource("docs://documents/{doc_id}")`, prompts with
  `@mcp.prompt`; test with `mcp dev mcp_server.py` (MCP Inspector on `http://127.0.0.1:6274`).
  Tool and parameter descriptions are what Claude reads: write them for a person.

## MCP in Claude Code

- **Add a server:** `claude mcp add <name> -- <command>` (stdio) or
  `claude mcp add --transport http <name> <url>`; `-H "Header: value"` adds a header.
  `claude mcp list`, `get`, `remove -s <scope>`, `login`, `logout`; `/mcp` in a session shows
  status and starts OAuth.
- **Scopes:** local (you, this project, in `~/.claude.json`), project (`.mcp.json`, committed,
  each person approves it once), user (you, every project). Same name: local beats project beats
  user beats plugin beats claude.ai connector.
- **Output limit:** a warning above 10,000 tokens per tool result, 25,000 by default
  (`MAX_MCP_OUTPUT_TOKENS`).
- **Desktop app:** the Code tab loads servers from `~/.claude.json`, `.mcp.json` and
  `claude_desktop_config.json`. Its **MCP servers** dialog showed only connectors and
  `.mcp.json` servers, not a local-scope HTTP server, and its project-server approval is not the
  one the CLI reads (`claude mcp list` kept saying "Pending approval" for `playwright` while the
  Desktop session used it).
- **A session reads the server list when it starts.** A server added later needs a new session,
  and a local-scope server belongs to the folder it was added in, so a session in a worktree does
  not see a server added in the main checkout.

## Servers tried on this repo

| Server | Scope | Auth | Result |
|---|---|---|---|
| Playwright (`npx -y @playwright/mcp@latest`, 0.0.83) | project (`.mcp.json`, [MR !14](https://gitlab.asoft-python.com/huy.nguyenduc/claude-training/-/merge_requests/14)) | none | Used for EXP-106, see [exercise-mcp-end-to-end.md](exercise-mcp-end-to-end.md) |
| GitLab official (`https://gitlab.asoft-python.com/api/v4/mcp`) | local | OAuth, scope `mcp` | Login worked, then `initialize` returned `404 Not Found`: the feature is not enabled on the company GitLab 19.3.6 CE. Removed |
| GitHub official (`https://api.githubcopilot.com/mcp/x/pull_requests`) | local | fine-grained token, one repo, 7 days | Read and commented on a PR on the GitHub mirror. Removed |

### Pitfalls met

- **The claude.ai "GitHub Integration" is not an MCP connector.** It links the account for
  Projects and cloud sessions and gives a local session no pull request tools. The GitHub MCP
  server has no dynamic client registration for OAuth, so Claude Code needs a token in a header.
- **Make the token small:** fine-grained, only the one repository, Pull requests read and write,
  Contents read-only, short expiry. The `/x/pull_requests` URL suffix loads only the pull request
  toolset (10 tools), so the server cannot touch issues, actions or settings. The token is stored
  in plain text in `~/.claude.json`: remove the server and revoke the token when done.
- **Never paste terminal output that echoes a token into chat.** Part of the token reached the
  conversation this way, so it had to be revoked.
- **A 401 is not proof that a server works.** The GitLab endpoint answered `401` with correct
  OAuth metadata before login and `404` after it. Test with a real `initialize` call before
  planning around a server.
- **Playwright MCP writes snapshots, console logs and screenshots to `.playwright-mcp/`** in the
  working directory; the folder is not in `.gitignore` yet.
- **A worktree-isolated session refuses commands it cannot verify** (`$(...)`, loops with `glab`
  or `gh`). Use plain commands and pass request bodies as files (`glab api --input body.json`).

## Self-check

1. A teammate clones the repo and the Playwright tools are missing in their first session. Why?
   Project servers from `.mcp.json` need each person's approval once (`/mcp`).
2. Should "attach this document with `@`" be a tool, a resource or a prompt? A resource: the app
   decides to fetch it, Claude does not call anything.
3. Why did the GitLab MCP server fail after a successful login? The endpoint exists for OAuth
   discovery, but MCP is not enabled on that instance, so authorized calls return `404`.
4. Why `/x/pull_requests` instead of the plain GitHub MCP URL? It limits the server to one
   toolset, which shrinks what a mistake or a prompt injection can do.

## Sources

- [Introduction to model context protocol](https://academy.claude.com/courses/introduction-to-model-context-protocol)
- [MCP in Claude Code](https://code.claude.com/docs/en/mcp) ·
  [Desktop app](https://code.claude.com/docs/en/desktop)
- [GitLab MCP server](https://docs.gitlab.com/user/gitlab_duo/model_context_protocol/mcp_server/)
- [GitHub MCP server](https://github.com/github/github-mcp-server) ·
  [Playwright MCP](https://github.com/microsoft/playwright-mcp)
