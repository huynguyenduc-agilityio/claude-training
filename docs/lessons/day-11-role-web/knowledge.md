# Day 11: role day, Web

Course: [Day 11](https://dojo.agilityio.dev/schedule/day-11.html), Developer track, Web role. The day
asks for Claude in Chrome against the training web app (console logs, form fill) and the browser pane
app-preview loop, lists Playwright MCP under "Skills today", and closes Developer Checkpoint 3. The
AI-native SDLC playbook course is for leads and seniors, so it is not required here. The rest comes
from running that on this repo.

The point of the day: verify the running product, not only the code. `pnpm test` covers `app/server`
and nothing in `app/web`, so only a browser can show that the form works.

## Three browsers

| | Claude in Chrome | Browser pane | Playwright MCP |
|---|---|---|---|
| Runs in | Real Chrome, the profile that has the extension | A tab inside the Claude desktop app | A browser the MCP server opens |
| Setup | Extension from the Chrome Web Store, plus sign-in | None beyond `.claude/launch.json` | `.mcp.json` (see Day 8) |
| Can start or stop the dev server | No | Yes, `preview_start` and `preview_stop` | No |
| Rejected requests in its console tool | No line shown | `Failed to load resource` with the status | Shown with the status |
| Files left in the repo | None | None | `.playwright-mcp/` |

## Claude in Chrome

- **Requirements in the course:** Chrome or Edge, `v1.0.36+`, and a direct Pro, Max, Team or Enterprise
  plan. The course does not say whether the version is the extension's or Claude Code's.
- **Connecting:** the course says to accept the prompt when Claude first needs the browser, or to run
  `/chrome`. Here `list_connected_browsers` showed the browser once the extension was installed and
  signed in, and `/chrome` was not needed.
- **It acts with the profile's sign-ins.** Whatever is signed in on that profile is within reach, so a
  new empty profile limits a mistake or a page that tries to steer Claude. The course does not ask for
  this; it was the owner's choice for this exercise.
- **Tracking starts late.** `read_network_requests` and `read_console_messages` record only from their
  first call, so call them, reload, then act. A first read that is empty proves nothing.
- **A clean console is not proof.** `read_console_messages` returned no line for responses that were
  `400`, while `read_network_requests` showed them. Check the network as well. Why the console tool
  misses them was not investigated.
- **Tabs are yours to close.** The tab group goes away with its last tab.

## Browser pane

- **The loop:** start the app with `preview_start`, change the code, read the screenshot and console,
  submit, fix, repeat.
- **Layout bugs show up here.** Two of them did at 1024px and on the aligned row, and no test in this
  repo could have caught them.
- **It cannot open `file://` pages,** so a local HTML file needs a server or another browser.

## Playwright MCP

- **Good for repeating a journey:** `browser_fill_form` fills the whole form in one call.
- **It writes `.playwright-mcp/` in the repo root,** and that folder is not in `.gitignore`. Delete it
  or it ends up in `git status`.

## Testing a form

- **Agree on the values first.** The plan fixes the four submits, so the three browsers can be compared.
- **Read the state, not the button.** While a request is pending, the old error is still on screen. A
  check that reads too early reports the previous result as if it were the new one.
- **Stopping every server is a different failure from stopping the API.** With only the API stopped,
  Vite's proxy answers `502`. With everything stopped the request stayed pending longer than the check
  waited.
- **A web change with no test runner has no regression test.** Say so in the merge request. A browser
  check proves today's code and nothing after it.
