/* Concept 1: Trend Composer — guided macro trend input */
function TrendComposer() {
  const [trend, setTrend] = React.useState('Colombia stops exporting coffee due to political instability');
  const [chips, setChips] = React.useState(['Coffee supply', 'Latin America', 'Currency: COP']);
  const [horizon, setHorizon] = React.useState('3-6mo');
  const [showSuggestions, setShowSuggestions] = React.useState(true);

  const examples = [
    { tag: 'Energy', text: 'OPEC+ announces 2M bpd production cut' },
    { tag: 'Rates',  text: 'Fed signals first rate cut in March 2026' },
    { tag: 'Geo',    text: 'China restricts rare earth exports to US' },
    { tag: 'Trade',  text: '25% tariff imposed on Mexican imports' },
  ];

  const secondOrder = [
    'Substitution: tea & energy drinks see demand spike',
    'Robusta from Vietnam fills part of the gap',
    'Café operators raise prices ~12% on average',
    'Quick-serve breakfast traffic dips in coffee-forward chains',
  ];

  return (
    <AppFrame route="/" label="01 — Trend Composer">
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Macro Impact Analyzer</h1>
          <p className="text-sm text-zinc-500 mt-1">Compose a trend, pick stocks, and run impact analysis.</p>
        </div>

        <Card>
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-semibold shrink-0">1</span>
            <h2 className="font-semibold text-zinc-900 text-sm">Macro trend</h2>
            <span className="ml-auto text-[11px] text-zinc-400">⌘K to choose example</span>
          </div>

          <div className="p-6 space-y-4">
            {/* Trend textarea with inline parsed entities */}
            <div className="relative">
              <textarea
                value={trend}
                onChange={(e) => setTrend(e.target.value)}
                rows={2}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm resize-none"
              />
              <div className="absolute right-2 bottom-2 text-[10px] text-zinc-400 font-mono">{trend.length}/280</div>
            </div>

            {/* Parsed entities */}
            <div>
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                Detected entities <span className="ml-1 text-emerald-600 normal-case tracking-normal">·  ai-parsed</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {chips.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-md px-2 py-0.5 text-xs font-medium">
                    {c}
                    <button onClick={() => setChips(chips.filter((_, j) => j !== i))} className="text-emerald-500/60 hover:text-emerald-700 ml-0.5">×</button>
                  </span>
                ))}
                <button className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-700 ring-1 ring-dashed ring-zinc-200 rounded-md px-2 py-0.5 text-xs">+ add</button>
              </div>
            </div>

            {/* Time horizon */}
            <div>
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Time horizon</div>
              <div className="inline-flex bg-zinc-100 rounded-lg p-0.5">
                {['1mo', '3-6mo', '1yr', '5yr'].map(h => (
                  <button key={h} onClick={() => setHorizon(h)}
                    className={cx('px-3 py-1 rounded-md text-xs font-medium transition-colors',
                      horizon === h ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500')}>
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Examples */}
            {showSuggestions && (
              <div className="border-t border-zinc-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Try a different angle</div>
                  <button onClick={() => setShowSuggestions(false)} className="text-[11px] text-zinc-400 hover:text-zinc-700">hide</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {examples.map((ex, i) => (
                    <button key={i} onClick={() => setTrend(ex.text)}
                      className="text-left bg-zinc-50 hover:bg-white hover:border-emerald-300 border border-transparent rounded-lg px-3 py-2 transition-all">
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{ex.tag}</div>
                      <div className="text-xs text-zinc-700 mt-0.5">{ex.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Second-order effects (NEW) */}
            <div className="bg-violet-50/50 border border-violet-200 rounded-lg p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-violet-600 text-xs">✦</span>
                <div className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">Second-order effects</div>
                <span className="text-[10px] text-violet-400 font-mono ml-auto">claude considers these too</span>
              </div>
              <ul className="space-y-1 text-xs text-violet-900/80">
                {secondOrder.map((s, i) => (
                  <li key={i} className="flex gap-2"><span className="text-violet-400">·</span>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <div className="text-xs text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Steps 2 & 3 below — same as today.
        </div>
      </div>
    </AppFrame>
  );
}

/* Concept 2: Live Impact Map — visual scatter to replace/augment list */
function ImpactMap() {
  const points = SAMPLE_RESULTS.map((r, i) => ({
    ...r,
    x: 0.15 + (Math.abs(r.score) / 5) * 0.7 * (Math.random() * 0.3 + 0.85),
    confY: r.conf === 'high' ? 0.78 : r.conf === 'medium' ? 0.5 : 0.25,
  }));

  return (
    <AppFrame route="/" label="02 — Impact Map">
      <div className="space-y-5">
        <div className="border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green">Complete</Badge>
            <span className="text-xs text-zinc-400">8 stocks · 5 indicators · 2.4s</span>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900">Colombia stops exporting coffee due to political instability</h1>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-zinc-100 rounded-lg p-0.5">
            {[
              { id: 'map', label: 'Map' },
              { id: 'list', label: 'List' },
              { id: 'table', label: 'Table' },
            ].map(v => (
              <button key={v.id}
                className={cx('px-3 py-1 rounded-md text-xs font-medium',
                  v.id === 'map' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500')}>
                {v.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-zinc-400">·  drag to inspect, click ticker for details</span>
        </div>

        <Card className="p-0 overflow-hidden">
          {/* Map area */}
          <div className="relative h-[420px] bg-gradient-to-b from-zinc-50/50 to-white">
            {/* Axes */}
            <div className="absolute inset-x-12 top-1/2 h-px bg-zinc-300" />
            <div className="absolute inset-y-8 left-1/2 w-px bg-zinc-200 border-dashed" style={{ borderLeft: '1px dashed #d4d4d8', background: 'transparent' }} />

            {/* Quadrant labels */}
            <div className="absolute top-3 left-12 text-[10px] uppercase tracking-wider text-zinc-300 font-medium">Bullish · high confidence</div>
            <div className="absolute top-3 right-12 text-[10px] uppercase tracking-wider text-zinc-300 font-medium">Bullish · low confidence</div>
            <div className="absolute bottom-3 left-12 text-[10px] uppercase tracking-wider text-zinc-300 font-medium">Bearish · high conf</div>

            <div className="absolute top-1/2 left-2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-zinc-400 font-medium" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>← bearish     bullish →</div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider text-zinc-400 font-medium">← low conf     high conf →</div>

            {/* Points */}
            {points.map((p, i) => {
              const left = `${(0.5 + (p.score / 6) * 0.45) * 100}%`;
              const top = `${(1 - p.confY) * 100}%`;
              const r = Math.max(20, 16 + Math.abs(p.score) * 6);
              const color = p.score > 1 ? '#10b981' : p.score < -1 ? '#f97316' : '#eab308';
              return (
                <div key={p.ticker} style={{ left, top }} className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                  <div style={{ width: r, height: r, background: color, opacity: 0.18 }} className="rounded-full" />
                  <div style={{ width: r * 0.6, height: r * 0.6, background: color }} className="absolute inset-0 m-auto rounded-full ring-2 ring-white" />
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 font-mono text-[10px] font-semibold text-zinc-700 whitespace-nowrap">
                    {p.ticker}
                  </div>
                  {/* tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-zinc-900 text-white text-[11px] rounded-md px-2 py-1.5 whitespace-nowrap z-10 shadow-lg">
                    <div className="font-mono font-semibold">{p.ticker} · {p.score > 0 ? '+' : ''}{p.score.toFixed(1)}</div>
                    <div className="text-zinc-300 max-w-[200px] whitespace-normal mt-0.5">{p.reason}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center gap-4 text-xs text-zinc-500">
            <span>Bubble size = absolute impact</span>
            <span>·</span>
            <span>Color = direction</span>
            <span className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> bullish
              <span className="w-2 h-2 rounded-full bg-yellow-400 ml-2" /> neutral
              <span className="w-2 h-2 rounded-full bg-orange-500 ml-2" /> bearish
            </span>
          </div>
        </Card>

        {/* Cluster summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-wider text-orange-500 font-medium">Most exposed</div>
            <div className="font-mono font-semibold text-zinc-900 mt-1">SBUX, JDE</div>
            <div className="text-xs text-zinc-500 mt-0.5">Direct coffee COGS exposure</div>
          </Card>
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-wider text-yellow-600 font-medium">Watch</div>
            <div className="font-mono font-semibold text-zinc-900 mt-1">DNUT, KDP, NSRGY</div>
            <div className="text-xs text-zinc-500 mt-0.5">Indirect / partial exposure</div>
          </Card>
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-wider text-emerald-600 font-medium">Safe / beneficiaries</div>
            <div className="font-mono font-semibold text-zinc-900 mt-1">MCD, KO, CMG</div>
            <div className="text-xs text-zinc-500 mt-0.5">Limited or substitution upside</div>
          </Card>
        </div>
      </div>
    </AppFrame>
  );
}

Object.assign(window, { TrendComposer, ImpactMap });
