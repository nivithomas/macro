/* Concept 3: Scenario Stress Tests — pre-built shocks library */
function StressTests() {
  const [selected, setSelected] = React.useState('opec');
  const scenarios = [
    { id: 'opec',    icon: '⛽', label: 'OPEC+ 2M bpd cut',           tag: 'Energy',     hits: 3, reads: 1240 },
    { id: 'fed',     icon: '🏛', label: 'Fed cuts 50bps',              tag: 'Rates',      hits: 5, reads: 980 },
    { id: 'tariff',  icon: '🚢', label: '25% tariff on China',          tag: 'Trade',      hits: 4, reads: 2110 },
    { id: 'rare',    icon: '⚙️', label: 'China rare-earth ban',         tag: 'Geopol',     hits: 2, reads: 410 },
    { id: 'dollar',  icon: '💵', label: 'DXY breaks 110',              tag: 'FX',         hits: 4, reads: 760 },
    { id: 'recess',  icon: '📉', label: 'US recession (-1% GDP)',       tag: 'Macro',      hits: 8, reads: 3050 },
    { id: 'oil-spike', icon: '🔥', label: 'Brent to $140',             tag: 'Energy',     hits: 3, reads: 530 },
    { id: 'taiwan',  icon: '🌐', label: 'Taiwan strait blockade',       tag: 'Geopol',     hits: 2, reads: 1820 },
    { id: 'wage',    icon: '👷', label: '6% wage inflation',           tag: 'Labor',      hits: 1, reads: 220 },
  ];

  return (
    <AppFrame route="/library" label="03 — Scenario Library">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Scenario Library</h1>
          <p className="text-sm text-zinc-500 mt-1">Run a curated stress test against any portfolio. One click.</p>
        </div>

        <div className="flex items-center gap-2">
          <input className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Search scenarios…" />
          <div className="flex gap-1">
            {['All', 'Rates', 'Energy', 'Trade', 'Geopol'].map(t =>
              <button key={t} className={cx('text-xs px-2.5 py-1.5 rounded-md',
                t === 'All' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50')}>{t}</button>
            )}
          </div>
          <Button variant="secondary" size="sm" className="ml-auto">+ Save current trend</Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {scenarios.map(s => (
            <button key={s.id} onClick={() => setSelected(s.id)}
              className={cx('text-left bg-white border rounded-xl p-4 transition-all hover:shadow-md',
                selected === s.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-zinc-200')}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{s.tag}</div>
                  <div className="text-sm font-medium text-zinc-900 mt-0.5 leading-snug">{s.label}</div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400">
                    <span className="font-mono">{s.reads.toLocaleString()} runs</span>
                    <span>·</span>
                    <span className="text-orange-500">{s.hits} hits in your portfolio</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected scenario detail panel */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-3">
            <span className="text-2xl">⛽</span>
            <div>
              <div className="text-xs text-zinc-500">Scenario · Energy</div>
              <h3 className="font-semibold text-zinc-900">OPEC+ announces a 2M bpd production cut</h3>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="secondary" size="sm">Customize</Button>
              <Button size="sm">Run on portfolio</Button>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-zinc-100">
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Indicators preloaded</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {['CL=F', 'BZ=F', 'XLE', 'USDCAD'].map(i =>
                  <span key={i} className="font-mono text-[11px] text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded px-1.5 py-0.5">{i}</span>
                )}
              </div>
            </div>
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Historical analogs</div>
              <ul className="text-xs text-zinc-700 mt-2 space-y-0.5">
                <li>· Oct 2022 — 2M cut, +12% Brent in 30d</li>
                <li>· Apr 2020 — collapse + cut, V-recovery</li>
              </ul>
            </div>
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Expected impact</div>
              <div className="text-xs text-zinc-700 mt-2">3 of 8 stocks above |0.3| correlation. Net <span className="text-emerald-600 font-mono font-semibold">+1.2</span></div>
            </div>
          </div>
        </Card>
      </div>
    </AppFrame>
  );
}

/* Concept 4: Streaming Analysis — richer in-progress view with thinking */
function StreamingAnalysis() {
  const steps = [
    { txt: 'Identifying relevant macro indicators',          done: true,  detail: '5 indicators selected by Claude' },
    { txt: 'Pulling 24mo weekly price history (Yahoo)',      done: true,  detail: '8 stocks · 2,304 datapoints' },
    { txt: 'Pulling FRED series',                            done: true,  detail: '3 series · COFFEE, DCOILWTICO, DTWEXM' },
    { txt: 'Computing Pearson correlations',                 done: true,  detail: 'Weighted by recency' },
    { txt: 'Estimating directional impact for each stock',   done: false, detail: 'Analyzing SBUX (4 of 8)…' },
  ];

  const liveResults = SAMPLE_RESULTS.slice(0, 4);
  const queued = SAMPLE_RESULTS.slice(4);

  return (
    <AppFrame route="/" label="04 — Live Stream">
      <div className="space-y-5">
        <div className="border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="indigo"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1 animate-pulse" />Analyzing</Badge>
            <span className="text-xs text-zinc-400">8 stocks · 5 indicators · started 4s ago</span>
            <span className="ml-auto text-xs text-zinc-500">est. 12s remaining</span>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900">Colombia stops exporting coffee due to political instability</h1>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Left: thinking panel */}
          <Card>
            <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-700">Thought process</span>
              <span className="text-[10px] text-zinc-400 font-mono ml-auto">claude-haiku-4.5</span>
            </div>
            <div className="p-5 space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  {s.done ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">✓</span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={cx('text-sm', s.done ? 'text-zinc-400' : 'text-zinc-900 font-medium')}>{s.txt}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Live thought bubble */}
            <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50">
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium mb-1.5">Currently considering</div>
              <p className="text-xs text-zinc-700 leading-relaxed font-mono">
                <span className="text-emerald-600">SBUX</span> sources ~25% of coffee from Latin America. Colombia accounts for ~10% of global arabica supply. Even with substitution from Brazil and Vietnam, near-term COGS would rise <span className="bg-yellow-100">~8–12%</span>…
                <span className="inline-block w-1.5 h-3 bg-zinc-700 ml-0.5 animate-pulse" />
              </p>
            </div>
          </Card>

          {/* Right: streaming results */}
          <Card>
            <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-700">Results</span>
              <span className="text-xs text-zinc-400 ml-auto">{liveResults.length} of 8 ready</span>
            </div>
            <div className="divide-y divide-zinc-100">
              {liveResults.map((r) => {
                const sc = r.score;
                const color = sc > 0 ? 'text-emerald-600' : sc < 0 ? 'text-orange-500' : 'text-yellow-500';
                return (
                  <div key={r.ticker} className="px-5 py-3 flex items-center gap-3 animate-in">
                    <div>
                      <div className="font-mono text-sm font-semibold text-emerald-700">{r.ticker}</div>
                      <div className="text-[11px] text-zinc-400">{r.name}</div>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <div className="w-20 h-1 bg-zinc-200 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 left-1/2 w-px h-full bg-zinc-300" />
                        <div className={cx('absolute h-full', sc > 0 ? 'bg-emerald-500' : 'bg-orange-500')}
                          style={{ left: sc > 0 ? '50%' : `${50 - Math.abs(sc) * 10}%`, width: `${Math.abs(sc) * 10}%` }} />
                      </div>
                      <span className={cx('font-mono font-bold text-sm w-10 text-right', color)}>
                        {sc > 0 ? '+' : ''}{sc.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {queued.map(r => (
                <div key={r.ticker} className="px-5 py-3 flex items-center gap-3 opacity-40">
                  <div>
                    <div className="font-mono text-sm font-semibold text-zinc-400">{r.ticker}</div>
                    <div className="text-[11px] text-zinc-300">{r.name}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="w-3 h-3 rounded-full border-2 border-zinc-300 border-t-transparent animate-spin block" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppFrame>
  );
}

Object.assign(window, { StressTests, StreamingAnalysis });
