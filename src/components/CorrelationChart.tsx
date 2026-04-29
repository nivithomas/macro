'use client'

import { format } from 'date-fns'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  stock: number
  indicator: number
}

interface CorrelationChartProps {
  data: DataPoint[]
  stockTicker: string
  indicatorName: string
  correlation: number
  dataPoints?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/15 bg-zinc-900/95 backdrop-blur px-3 py-2 shadow-md">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1">
        {format(new Date(label as string), "MMM d, yyyy")}
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-zinc-400 flex-1 truncate">{p.name}</span>
          <span className="font-mono font-semibold text-zinc-100 tabular-nums">
            {(p.value as number).toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CorrelationChart({ data, stockTicker, indicatorName, correlation, dataPoints }: CorrelationChartProps) {
  if (data.length < 2) return null

  const lowSample = dataPoints !== undefined && dataPoints < 20
  const corrColor = lowSample
    ? '#ca8a04'
    : correlation > 0.3 ? '#059669' : correlation < -0.3 ? '#ea580c' : '#ca8a04'

  // Unique per-instance gradient IDs so multiple charts on the same page don't collide
  const stockGradId = `stockFill-${stockTicker}`
  const indGradId   = `indFill-${stockTicker}`

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="font-mono font-semibold text-emerald-400">{stockTicker}</span>
        <span className="text-zinc-600">vs</span>
        <span>{indicatorName}</span>
        <span className="ml-auto font-mono flex items-center gap-1.5" style={{ color: corrColor }}>
          r = {correlation > 0 ? '+' : ''}{correlation.toFixed(3)}
          <span className="text-zinc-500 font-normal">(weekly log returns)</span>
          {lowSample && <span className="text-yellow-500 font-normal">(low sample)</span>}
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -24 }}>
          <defs>
            <linearGradient id={stockGradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"   stopColor="#10b981" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={indGradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"   stopColor="#f97316" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#71717a' }}
            tickFormatter={(v: string) => format(new Date(v), "MMM ''yy")}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={{ stroke: '#3f3f46' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#71717a' }}
            tickCount={3}
            tickLine={false}
            axisLine={false}
            width={32}
          />

          <ReferenceLine y={100} stroke="#3f3f46" strokeDasharray="3 4" />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: '#10b981', strokeDasharray: '2 2', strokeOpacity: 0.5 }}
          />

          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 6 }}
            formatter={(value: string) => (
              <span style={{ color: '#71717a' }}>{value}</span>
            )}
          />

          <Area
            type="natural"
            dataKey="stock"
            name={stockTicker}
            stroke="#059669"
            strokeWidth={1.75}
            strokeLinecap="round"
            fill={`url(#${stockGradId})`}
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 3, fill: '#059669', strokeWidth: 0 }}
          />
          <Area
            type="natural"
            dataKey="indicator"
            name={indicatorName}
            stroke="#f97316"
            strokeWidth={1.75}
            strokeDasharray="4 2"
            strokeLinecap="round"
            fill={`url(#${indGradId})`}
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
