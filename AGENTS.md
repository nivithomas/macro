<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

# Macro Impact Analyzer — Claude Code Instructions

## Project Overview
Next.js app (TypeScript, Prisma, SQLite) that lets users input a macro trend, select stocks, and get AI-powered analysis of how that trend would impact each stock's performance. Analysis runs as a streaming API response.

## Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Prisma + SQLite (`dev.db`)
- **Market data**: Yahoo Finance (`src/lib/yahoo-finance.ts`), FRED (`src/lib/fred.ts`)
- **AI**: Claude API (`src/lib/claude.ts`)
- **Correlation logic**: `src/lib/correlation.ts`
- **Key components**: `CorrelationChart.tsx`, `ImpactCard.tsx`, `ResultsGrid.tsx`
- **Analysis streaming**: `src/app/api/analysis/[id]/stream/route.ts`

## Active Work: Four-Area Improvement Pass

Work through these fixes in order. Do not move to the next area until the current one is complete and the dev server still runs without errors.

---

## Fix 1: Calculations (HIGHEST PRIORITY — fixes everything downstream)

**File**: `src/lib/correlation.ts`

**Problem**: Pearson correlation is being run on raw price levels, which are non-stationary. This produces spurious correlations (e.g. two upward-trending series appearing correlated when they are not). All scores derived from these correlations are unreliable.

**Fix**:
1. Before computing any correlation, convert all price series to weekly log returns: `r_t = ln(P_t / P_{t-1})`. Do this for both the stock and each indicator.
2. Run Pearson r on the returns series, not the levels series.
3. Add a helper function `toWeeklyLogReturns(prices: number[]): number[]` and use it everywhere correlation is computed.
4. Keep the existing r value display in the UI but add a label clarifying it is computed on weekly returns, not price levels.

---

## Fix 2: Logic

**Files**: `src/lib/claude.ts`, `src/app/api/analysis/[id]/stream/route.ts`

**Problems and fixes**:

1. **Correlation direction mismatch**: When the model identifies that a historical correlation is demand-driven (e.g. SBUX rising with coffee futures because coffee demand pulls both up), but the scenario is a supply shock (coffee prices spike because supply is cut), the score should be *inverted or discounted*, not passed through as-is. Add logic that when Claude's narrative identifies a "demand-driven correlation" in a supply-shock scenario, the correlation weight is reduced by 50% and a warning flag is set.

2. **Indicator weighting**: Not all indicators are equal. The most directly causally linked indicator (e.g. KC=F Coffee Futures for a coffee supply scenario) should receive a multiplier of 2x in the final score. Indicators flagged as "macro noise" or "shared beta" (e.g. Gold Futures, TIPS in the coffee scenario) should receive 0.5x. Have Claude classify each indicator as "direct", "indirect", or "macro_noise" and apply these weights before computing the final score.

3. **Shock duration input**: Add a `duration` field to the analysis input (options: "1-4 weeks", "1-3 months", "6-12 months", "12+ months"). Pass this to Claude and require it to reason about hedging buffers explicitly: short durations are buffered by existing contracts; long durations flow through to unhedged volumes. Surface this in the output.

4. **Weak-link stock filtering**: If a stock's highest |r| across all indicators is below 0.15 after applying returns-based correlation, flag it in the UI as "Weak causal link — results unreliable" rather than surfacing a low-confidence score as if it were meaningful.

---

## Fix 3: Information

**Files**: `src/lib/claude.ts` (system prompt), `src/components/ImpactCard.tsx`

**What to add**:

1. **Time horizon on every output**: Every analysis result must state explicitly whether the impact estimate applies to the next 1 month, 1 quarter, or 1 year. Add this as a required field in the structured output and display it prominently in `ImpactCard.tsx` near the score.

2. **Historical analog**: Claude's system prompt must require it to cite at least one specific historical comparable event with an approximate date range and what happened to the stock during that period (e.g. "During the 2010-2011 coffee price spike, SBUX gross margins compressed by ~150bps over two quarters"). If no strong analog exists, Claude must say so explicitly rather than omitting it. Display this in a new "Historical Analog" section in `ImpactCard.tsx`.

3. **Hedge book note**: For any stock in the consumer staples, food & beverage, or airline sectors where the scenario involves a commodity input cost shock, Claude must explicitly address whether the company hedges that input and for how long, based on its knowledge of the company. Display this as a callout box in `ImpactCard.tsx`.

4. **Analyst EPS sensitivity**: Where Claude has knowledge of it, include a line stating what a 10% move in the relevant commodity typically does to the company's EPS (e.g. "A 10% rise in Arabica prices reduces SBUX EPS by approximately $0.04-0.06 based on typical unhedged exposure"). Flag this as approximate and not investment advice.

---

## Fix 4: UI/UX

**Files**: `src/components/ImpactCard.tsx`, `src/components/CorrelationChart.tsx`, `src/components/ResultsGrid.tsx`, `src/app/analysis/[id]/page.tsx`

**Changes**:

1. **Score legend**: Move the score range explanation (-5 = strongly bearish, 0 = neutral, +5 = strongly bullish) out of the footnote and into a persistent callout at the top of the results page, visible before any stock cards.

2. **Directional headline first**: In `ImpactCard.tsx`, the top line should be the directional verdict (Bearish / Neutral / Bullish) in large text with color coding (red / gray / green), followed by the confidence level. Remove "Neutral / Medium confidence" as a combined label — split these into two separate elements.

3. **Chart y-axis clarification**: In `CorrelationChart.tsx`, both series must display on a normalized scale (rebased to 100 at the start of the window). Add a label "Rebased to 100" on the y-axis. If the chart currently plots raw price levels, rebase them before rendering.

4. **Signal threshold tooltip**: Add a tooltip or inline explainer next to the signal threshold slider that says: "Pearson |r| is a measure of historical co-movement between 0 and 1. Higher values = stronger historical relationship. 0.20 is a common minimum threshold for a signal worth examining."

5. **Weak-link warning UI**: For stocks flagged as weak causal link (per Fix 2, point 4), render their card with a muted style and a yellow warning banner at the top: "Weak causal connection detected. Treat this analysis with extra skepticism."

6. **Time horizon badge**: Display the time horizon (from Fix 3, point 1) as a badge next to the stock ticker in the card header.

---

## Do Not Touch
- `src/generated/` — auto-generated Prisma files, never edit directly
- `prisma/schema.prisma` — only modify if a schema change is explicitly required by the above fixes
- `.env` and `.env.local`

## When You Are Done
Run `npm run build` and confirm it completes without type errors. Then summarize which files were changed and what was changed in each.