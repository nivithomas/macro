/* Concept 5: Comparison Mode — run two trends side-by-side on same portfolio */
function ComparisonMode() {
  const trendA = 'Colombia stops exporting coffee';
  const trendB = 'Robusta supply doubles from Vietnam';

  const aResults = SAMPLE_RESULTS;
  const bResults = SAMPLE_RESULTS.map(r => ({ ...r, score: -r.score * 0.6 + (Math.random() - 0.5) * 0.5 }));

  const merged = aResults.map((a, i) => {
    const b = bResults[i];
    const net = a.score + b.score;
    return { ticker: a.ticker, name: a.name, a: a.score, b: b.score, net };
  });

  const Bar = ({ score, color }) => {
    const w = Math.min(Math.abs(score) * 16, 80);
    return (
      <div className="flex items-center justify-center w-44 h-5 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-300" />
        <div className="absolute h-2 rounded-sm" style={{
          background: color,
          left: score >= 0 ? '50%' : `calc(50% - ${w}px)`,
          width: `${w}px`
        }} />
      </div>
    );
  };

  return (
    <AppFrame route="/" label="05 — Compare">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple">Compare mode</Badge>
            <span className="text-xs text-zinc-400">Same portfolio · 2 trends</span>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900">Coffee supply scenarios</h1>
        </div>

        {/* Two trend inputs */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">A</span>
              <span className="text-xs text-zinc-500">Trend A</span>
              <Badge variant="green" className="ml-auto">Bearish coffee</Badge>
            </div>
            <p className="text-sm text-zinc-900 font-medium">{trendA}</p>
            <div className="text-[11px] text-zinc-400 mt-2 font-mono">corr indicators: KC=F, COP, DXY</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-md bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">B</span>
              <span className="text-xs text-zinc-500">Trend B</span>
              <Badge variant="purple" className="ml-auto">Bullish coffee glut</Badge>
            </div>
            <p className="text-sm text-zinc-900 font-medium">{trendB}</p>
            <div className="text-[11px] text-zinc-400 mt-2 font-mono">corr indicators: KC=F, VND, sugar</div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-2.5 text-center text-[11px] font-medium text-emerald-700 uppercase tracking-wider">A · Bearish</th>
                <th className="px-4 py-2.5 text-center text-[11px] font-medium text-violet-700 uppercase tracking-wider">B · Bullish</th>
                <th className="px-4 py-2.5 text-center text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Hedge ratio</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {merged.map(r => {
                const hedged = Math.sign(r.a) !== Math.sign(r.b) && Math.abs(r.a + r.b) < Math.abs(r.a) * 0.4;
                return (
                  <tr key={r.ticker} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <div className="font-mono text-xs font-semibold text-emerald-700">{r.ticker}</div>
                      <div className="text-[11px] text-zinc-400">{r.name}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <Bar score={r.a} color={r.a > 0 ? '#10b981' : '#f97316'} />
                        <span className={cx('font-mono text-xs w-10 text-right', r.a > 0 ? 'text-emerald-600' : 'text-orange-500')}>
                          {r.a > 0 ? '+' : ''}{r.a.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <Bar score={r.b} color={r.b > 0 ? '#7c3aed' : '#a78bfa'} />
                        <span className={cx('font-mono text-xs w-10 text-right', r.b > 0 ? 'text-violet-600' : 'text-violet-400')}>
                          {r.b > 0 ? '+' : ''}{r.b.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {hedged ? (
                        <Badge variant="green">✓ hedged</Badge>
                      ) : (
                        <span className="text-zinc-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={cx('font-mono font-bold', r.net > 0 ? 'text-emerald-600' : r.net < 0 ? 'text-orange-500' : 'text-zinc-400')}>
                        {r.net > 0 ? '+' : ''}{r.net.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <div className="bg-violet-50/50 border border-violet-200 rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-violet-700 font-semibold mb-1.5">Hedge insight</div>
          <p className="text-sm text-violet-900/80">3 stocks (<span className="font-mono">KO, MCD, CMG</span>) show inverse exposure across A &amp; B — they could partially hedge a coffee-supply uncertainty.</p>
        </div>
      </div>
    </AppFrame>
  );
}

/* Concept 6: Time Travel / Backtest — "what if this happened in 2020?" */
function TimeTravel() {
  const [year, setYear] = React.useState(2022);
  const events = [
    { y: 2020, label: 'COVID Mar 2020', delta: -34 },
    { y: 2021, label: 'Suez blockage', delta: -3 },
    { y: 2022, label: 'Russia invades Ukraine', delta: -12 },
    { y: 2023, label: 'SVB collapse', delta: -8 },
    { y: 2024, label: 'Yen carry unwind', delta: -6 },
  ];

  return (
    <AppFrame route="/" label="06 — Backtest">
      <div className="space-y-5">
        <div className="border-b border-zinc-200 pb-4">
          <Badge variant="purple">Backtest</Badge>
          <h1 className="text-lg font-semibold text-zinc-900 mt-1.5">If this trend hit in <span className="font-mono text-violet-700">{year}</span>, here's what happened</h1>
          <p className="text-sm text-zinc-500 mt-0.5">"Colombia stops exporting coffee" mapped to historical analog.</p>
        </div>

        {/* Timeline scrubber */}
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-3">Drag to a historical analog event</div>
          <div className="relative h-24">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-zinc-200" />
            {events.map(e => (
              <button key={e.y} onClick={() => setYear(e.y)}
                className="absolute -translate-x-1/2 group"
                style={{ left: `${((e.y - 2020) / 4) * 100}%`, top: 0 }}>
                <div className={cx('w-3 h-3 rounded-full ring-4 transition-all',
                  year === e.y ? 'bg-violet-600 ring-violet-200' : 'bg-zinc-300 ring-transparent group-hover:bg-zinc-500')}
                  style={{ marginTop: 'calc(50% - 6px)' }} />
                <div className={cx('absolute left-1/2 -translate-x-1/2 top-12 text-center whitespace-nowrap text-[10px]',
                  year === e.y ? 'text-violet-700 font-semibold' : 'text-zinc-400')}>
                  <div className="font-mono">{e.y}</div>
                  <div>{e.label}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Coffee futures (KC=F)</div>
            <div className="font-mono text-2xl font-bold text-emerald-600 mt-1">+47%</div>
            <div className="text-xs text-zinc-500 mt-0.5">in 90 days following Feb 2022</div>
          </Card>
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">SBUX vs S&amp;P</div>
            <div className="font-mono text-2xl font-bold text-orange-500 mt-1">−18.2%</div>
            <div className="text-xs text-zinc-500 mt-0.5">underperformance · 90d</div>
          </Card>
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Best hedge</div>
            <div className="font-mono text-lg font-bold text-zinc-900 mt-1">DBA + KC=F long</div>
            <div className="text-xs text-emerald-600 mt-0.5">+9.4% in same period</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-3">Historical price overlay</div>
          {/* Fake chart */}
          <svg viewBox="0 0 400 100" className="w-full h-32">
            <path d="M0,60 L40,55 L80,52 L120,48 L160,40 L200,30 L240,25 L280,15 L320,18 L360,10 L400,12" fill="none" stroke="#10b981" strokeWidth="1.5" />
            <path d="M0,55 L40,60 L80,65 L120,70 L160,80 L200,82 L240,85 L280,88 L320,80 L360,82 L400,78" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="160" y1="0" x2="160" y2="100" stroke="#a78bfa" strokeWidth="1" strokeDasharray="2 2" />
            <text x="162" y="10" fontSize="8" fill="#7c3aed">Event</text>
          </svg>
          <div className="flex items-center gap-4 text-[11px] text-zinc-500 mt-1">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500" /> Coffee futures</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-500" style={{borderTop:'1px dashed'}} /> SBUX</span>
          </div>
        </Card>
      </div>
    </AppFrame>
  );
}

Object.assign(window, { ComparisonMode, TimeTravel });
