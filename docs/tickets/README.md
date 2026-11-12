# Backlog

Tickets for the AI Usage & Cost Tracker. One file per ticket, named `EXP-1XX.md`.

| Ticket | Type | Title | Status |
|---|---|---|---|
| [EXP-101](EXP-101.md) | Bug | Dashboard total doesn't match the usage records | Done |
| [EXP-102](EXP-102.md) | Feature | Alert when monthly spending passes 80% of the budget | Done |
| [EXP-103](EXP-103.md) | Bug | lyra-flash costs higher than the provider invoice | Done |
| [EXP-104](EXP-104.md) | Feature | Export a month of usage records to CSV | Done |
| [EXP-105](EXP-105.md) | Bug | API accepts negative token counts | Done |
| [EXP-106](EXP-106.md) | Bug | A token count above the safe integer range breaks every API call | Done |
| [EXP-107](EXP-107.md) | Bug | Model names like "constructor" are accepted and break the month | Done |
| [EXP-108](EXP-108.md) | Bug | Cached input tokens above input tokens give a negative cost | Done |
| [EXP-109](EXP-109.md) | Bug | One usage row without a price breaks every read of its month | Done |
| [EXP-110](EXP-110.md) | Bug | An invalid pricing.json is accepted silently and gives wrong costs | Done |
| [EXP-111](EXP-111.md) | Feature | Add a usage record from the dashboard | Done |
| [EXP-112](EXP-112.md) | Feature | Store project budgets and report each project's budget status | Open |
| [EXP-113](EXP-113.md) | Feature | Show a banner for each project that is near or over its budget | Open |
| [EXP-114](EXP-114.md) | Feature | Set and remove project budgets from the dashboard | Open |

## Template

```markdown
# EXP-1XX: <title>

- **Type:** Bug | Feature
- **Priority:** Critical | High | Medium | Low
- **Reporter:** <team or role>

## Description

## Acceptance criteria

## Repro (filled in by the developer)
```
