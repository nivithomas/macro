# Macro Impact — Design Handoff

This bundle contains **4 design concepts** to add to the [macro-impact](https://github.com/yourname/macro-impact) Next.js app. Each lives in its own folder and can be implemented independently.

| #  | Folder | What it is | Effort |
|---|---|---|---|
| 02 | `02-impact-map/` | Scatter-plot view of analysis results (impact × confidence) | M |
| 04 | `04-live-stream/` | Two-column streaming view: thinking process + results | M |
| 06 | `06-backtest/` | Map a trend to a historical analog event with timeline scrubber | L |
| 07 | `07-narrative-brief/` | TL;DR portfolio summary card with copy-as-Slack | S |

## How to use this with Claude Code

1. Drop this folder into your `macro-impact/` repo (e.g. as `design/`).
2. Open the repo in Claude Code.
3. Pick a concept and tell Claude:
   > "Read `design/07-narrative-brief/README.md` and `design/07-narrative-brief/preview.html`. Implement it in our app following the README's file map."
4. Each concept's `preview.html` is openable in any browser to see the live design.

## About the design files

The HTML in each folder is a **design reference** — a working prototype showing intended look and behavior, not production code to paste. Recreate the design in your existing Next.js + React 19 + Tailwind v4 environment, reusing the components in `src/components/ui/` (`Card`, `Button`, `Badge`).

## Fidelity

**Hi-fi** — colors, spacing, typography, and interactions in the prototypes match what should ship. Use the exact emerald-600 / zinc neutral palette already in the repo. Geist + Geist Mono fonts are already loaded via `next/font/google` in `src/app/layout.tsx`.

## Suggested order

1. **07 Narrative Brief** — smallest, additive to existing analysis page. Ship first.
2. **02 Impact Map** — additive view toggle on the same page.
3. **04 Live Stream** — replaces existing "Progress" panel; touches SSE handling.
4. **06 Backtest** — biggest scope, new route + likely new API endpoint.

## Repo files referenced across concepts

- `src/app/analysis/[id]/page.tsx` — main analysis page (concepts 02, 04, 07)
- `src/app/page.tsx` — home / new analysis (concepts 06)
- `src/components/ImpactCard.tsx` — current per-stock card
- `src/components/PortfolioSummary.tsx` — heatmap table
- `src/components/ui/{Card,Button,Badge}.tsx` — primitives
- `src/lib/types.ts` — `StockResult`, `AnalysisRecord`, `SSEEvent`
- `src/app/api/analysis/[id]/stream/route.ts` — SSE producer (concept 04)
