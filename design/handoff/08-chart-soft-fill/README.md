# 08 — Correlation Chart: Soft-fill Area

Aesthetic upgrade to `src/components/CorrelationChart.tsx`. Same data, same recharts dependency — replace the lines with subtle gradient-filled areas, plus a handful of polish tweaks that lift the whole thing.

![Preview](./preview.html)

## Where it goes

**File to edit:** `src/components/CorrelationChart.tsx`
No new dependencies. No prop changes. Drop-in replacement.

## What changes

### 1. Lines → gradient areas

Swap `<Line>` for `<Area>` and add `<defs>` with two `linearGradient`s — one emerald (stock), one orange (indicator). Keep the line stroke on top of the fill so the curve still reads cleanly. Keep the dashed pattern on the indicator stroke to preserve role distinction at a glance.

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={140}>
  <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -24 }}>
    <defs>
      <linearGradient id={`stockFill-${stockTicker}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%"  stopColor="#10b981" stopOpacity={0.18} />
        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
      </linearGradient>
      <linearGradient id={`indFill-${stockTicker}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%"  stopColor="#f97316" stopOpacity={0.12} />
        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
      </linearGradient>
    </defs>

    {/* axes + tooltip + legend stay below — see polish notes */}

    <Area
      type="natural"
      dataKey="stock"
      name={stockTicker}
      stroke="#059669"
      strokeWidth={1.75}
      strokeLinecap="round"
      fill={`url(#stockFill-${stockTicker})`}
    />
    <Area
      type="natural"
      dataKey="indicator"
      name={indicatorName}
      stroke="#f97316"
      strokeWidth={1.75}
      strokeDasharray="4 2"
      strokeLinecap="round"
      fill={`url(#indFill-${stockTicker})`}
    />
  </AreaChart>
</ResponsiveContainer>
```

> ⚠️ Make the gradient `id`s unique per chart instance (suffix with `stockTicker` or a `useId()`). Otherwise two charts on the same page collide and the second one renders empty/wrong fills.

### 2. Curve type: `monotone` → `natural`

Slightly gentler curvature. Less "data-vizzy," more editorial. If `natural` looks too loose for noisy series, fall back to `monotone`.

### 3. Reference line at rebased = 100

Visual anchor — the eye instantly sees who's above/below the baseline.

```tsx
<ReferenceLine y={100} stroke="#e4e4e7" strokeDasharray="3 4" />
```

### 4. Custom tooltip

The default recharts tooltip is functional but ugly. Replace with a stacked, mono-numbered version:

```tsx
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-200 bg-white/95 backdrop-blur px-3 py-2 shadow-md">
      <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono mb-1">
        {format(new Date(label), 'MMM d, yyyy')}
      </div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-600 flex-1">{p.name}</span>
          <span className="font-mono font-semibold text-zinc-900 tabular-nums">
            {p.value.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  )
}
```

`format` from `date-fns` (already in your deps).

### 5. Hover crosshair

Replace recharts' default grey block cursor:

```tsx
<Tooltip
  content={<ChartTooltip />}
  cursor={{ stroke: '#10b981', strokeDasharray: '2 2', strokeOpacity: 0.5 }}
/>
```

### 6. Tighter axes + better date format

```tsx
<XAxis
  dataKey="date"
  tick={{ fontSize: 10, fill: '#a1a1aa' }}
  tickFormatter={(v: string) => format(new Date(v), "MMM ''yy")}
  interval="preserveStartEnd"
  tickLine={false}
  axisLine={{ stroke: '#e4e4e7' }}
/>
<YAxis
  tick={{ fontSize: 10, fill: '#a1a1aa' }}
  tickCount={3}
  tickLine={false}
  axisLine={false}
  width={32}
/>
```

Drop the rotated "Rebased to 100" label — the card header already says it. Width=32 gives the chart more horizontal room.

### 7. Optional: subtle inner panel

Wrap the `ResponsiveContainer` in a `bg-zinc-50/50 rounded-lg p-3 -mx-1` so the chart reads as its own object inside the card. Skip if the parent card already has visual weight.

## Color tokens (unchanged)

| Element | Color |
|---|---|
| Stock line + fill | `#059669` / `#10b981` (emerald-600/500) |
| Indicator line + fill | `#f97316` (orange-500) |
| Grid / axis line | `#e4e4e7` (zinc-200) |
| Axis text | `#a1a1aa` (zinc-400) |
| Reference line | `#e4e4e7` dashed `3 4` |

## Acceptance

- [ ] Both series render as filled areas with vertical gradient that fades to 0 alpha at the bottom.
- [ ] Indicator stroke remains dashed `4 2`; stock stroke remains solid.
- [ ] Multiple `<CorrelationChart>` on the same page render independently (unique gradient IDs).
- [ ] Tooltip shows formatted date + both values stacked with mono numerics.
- [ ] Reference line at y=100 is visible but quiet (zinc-200 dashed).
- [ ] X-axis ticks read like `Mar '24`, not `2024-03`.
- [ ] No layout shift vs current chart at the same `height` (140px).

## Out of scope

- Z-score / dual-axis variants (separate concept — could ship later as a toggle).
- Annotation pins on extremes.
- Returns scatter view.
- Dark theme.
