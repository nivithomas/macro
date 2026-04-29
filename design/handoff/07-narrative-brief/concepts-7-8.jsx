/* Concept 7: Narrative Brief — TL;DR portfolio level summary */
function NarrativeBrief() {
  return (
    <AppFrame route="/" label="07 — Narrative Brief">
      <div className="space-y-5">
        <div className="border-b border-zinc-200 pb-4 flex items-center gap-2">
          <Badge variant="green">Complete</Badge>
          <span className="text-xs text-zinc-400">Apr 28, 2026 · 2.4s</span>
          <Button variant="secondary" size="sm" className="ml-auto">Copy as Slack</Button>
          <Button variant="secondary" size="sm">Export PDF</Button>
        </div>

        {/* Hero brief card */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-baseline gap-3">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">Brief</div>
            <h1 className="text-lg font-semibold text-zinc-900">Colombia stops exporting coffee due to political instability</h1>
          </div>

          <div className="px-6 py-5 space-y-4 bg-gradient-to-b from-emerald-50/30 to-white">
            <p className="text-base text-zinc-800 leading-relaxed">
              Your 8-stock coffee/QSR portfolio is <span className="font-semibold text-orange-600">net bearish (−1.2)</span> on
              this scenario. <span className="font-mono font-semibold text-emerald-700">SBUX</span> and{' '}
              <span className="font-mono font-semibold text-emerald-700">JDE</span> carry the most concentrated risk via
              direct COGS exposure, while <span className="font-mono font-semibold text-emerald-700">MCD</span> and{' '}
              <span className="font-mono font-semibold text-emerald-700">KO</span> may benefit modestly from substitution.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white border border-zinc-200 rounded-lg p-3">
                <div className="text-[11px] uppercase tracking-wider text-orange-500 font-medium">Watch closely</div>
                <div className="text-sm font-mono font-semibold text-zinc-900 mt-0.5">SBUX, JDE, DNUT</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-3">
                <div className="text-[11px] uppercase tracking-wider text-yellow-600 font-medium">Hedges to consider</div>
                <div className="text-sm font-mono font-semibold text-zinc-900 mt-0.5">KC=F long, DBA</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-3">
                <div className="text-[11px] uppercase tracking-wider text-emerald-600 font-medium">Possible upside</div>
                <div className="text-sm font-mono font-semibold text-zinc-900 mt-0.5">MCD, KO, CMG</div>
              </div>
            </div>
          </div>

          {/* Key questions to ask */}
          <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/40">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-2">Questions to investigate</div>
            <div className="space-y-2">
              {[
                'Has SBUX disclosed % of green coffee from Colombia in their 10-K?',
                'How quickly can roasters switch to Brazilian or Vietnamese supply?',
                'What was the COGS impact during the 2014 Colombian rust outbreak?',
              ].map((q, i) => (
                <button key={i} className="w-full text-left text-sm text-zinc-700 hover:text-zinc-900 hover:bg-white rounded-md px-2 py-1.5 transition-colors flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">→</span>
                  <span>{q}</span>
                  <span className="ml-auto text-[10px] text-zinc-300 group-hover:text-zinc-500">ask Claude</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Confidence + caveats strip */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-50 flex items-center justify-center">
              <span className="font-mono font-bold text-emerald-700 text-sm">75%</span>
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-900">Avg confidence</div>
              <div className="text-[11px] text-zinc-500">5 high · 2 medium · 1 low</div>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-yellow-50 flex items-center justify-center">
              <span className="text-yellow-700 text-sm">⚠</span>
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-900">Tail risk</div>
              <div className="text-[11px] text-zinc-500">Sustained &gt;90d would compound</div>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-zinc-100 flex items-center justify-center">
              <span className="text-zinc-600 text-sm">i</span>
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-900">Not advice</div>
              <div className="text-[11px] text-zinc-500">Patterns ≠ prediction</div>
            </div>
          </Card>
        </div>

        <div className="text-xs text-zinc-400 text-center">
          Detailed per-stock cards collapsed below — open one to drill into business model, supply chain, correlations.
        </div>
      </div>
    </AppFrame>
  );
}

/* Concept 8: Watchlist Alerts — turn analysis into ongoing monitoring */
function WatchlistAlerts() {
  const alerts = [
    { sev: 'high', when: '2h ago', title: 'KC=F broke +5% threshold', body: 'Coffee futures up 5.2% w/w — your "Colombia coffee" thesis is firing.', stocks: ['SBUX', 'JDE', 'DNUT'], unread: true },
    { sev: 'med',  when: '1d ago', title: 'COP/USD weakening', body: 'Colombian peso down 2.1% — secondary indicator now active.', stocks: ['SBUX', 'JDE'], unread: true },
    { sev: 'low',  when: '3d ago', title: 'Fed minutes neutral', body: 'No surprise from FOMC — your "rate cut Mar 2026" thesis confidence unchanged.', stocks: ['XLF', 'JPM'], unread: false },
  ];

  const sevColor = { high: 'border-l-orange-500 bg-orange-50/40', med: 'border-l-yellow-400 bg-yellow-50/40', low: 'border-l-zinc-300 bg-white' };
  const sevDot = { high: 'bg-orange-500', med: 'bg-yellow-400', low: 'bg-zinc-300' };

  return (
    <AppFrame route="/watchlist" label="08 — Watchlist">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Watchlist</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Live monitoring of your saved theses.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm">Slack ✓</Button>
            <Button variant="secondary" size="sm">Email ✓</Button>
            <Button size="sm">+ New thesis</Button>
          </div>
        </div>

        {/* Active theses */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'Coffee supply shock', portfolio: 'QSR · 8 stocks', net: -1.2, indicators: ['KC=F', 'COP'], status: 'active' },
            { name: 'Fed cuts March', portfolio: 'Banks · 6 stocks', net: +0.8, indicators: ['DGS10', 'XLF'], status: 'active' },
            { name: 'OPEC supply cut', portfolio: 'Travel · 5 stocks', net: -0.4, indicators: ['CL=F'], status: 'paused' },
          ].map(t => (
            <Card key={t.name} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={cx('w-1.5 h-1.5 rounded-full', t.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300')} />
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">{t.status}</span>
                <span className={cx('ml-auto font-mono font-bold text-sm', t.net > 0 ? 'text-emerald-600' : 'text-orange-500')}>
                  {t.net > 0 ? '+' : ''}{t.net.toFixed(1)}
                </span>
              </div>
              <div className="text-sm font-semibold text-zinc-900">{t.name}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{t.portfolio}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {t.indicators.map(i =>
                  <span key={i} className="font-mono text-[10px] text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded px-1.5 py-0.5">{i}</span>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Alert feed */}
        <div>
          <div className="flex items-center mb-2">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Recent alerts</span>
            <span className="ml-auto text-xs text-zinc-400">2 unread</span>
          </div>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={cx('border border-zinc-200 border-l-4 rounded-lg p-4 flex gap-3', sevColor[a.sev])}>
                <span className={cx('w-2 h-2 rounded-full mt-1.5 shrink-0', sevDot[a.sev])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold text-zinc-900 text-sm">{a.title}</h3>
                    {a.unread && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    <span className="ml-auto text-[11px] text-zinc-400 shrink-0">{a.when}</span>
                  </div>
                  <p className="text-sm text-zinc-600 mt-0.5">{a.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {a.stocks.map(s =>
                      <span key={s} className="font-mono text-[11px] font-semibold text-emerald-700 bg-white ring-1 ring-emerald-200 rounded px-1.5 py-0.5">{s}</span>
                    )}
                    <button className="ml-auto text-xs text-zinc-500 hover:text-zinc-900">Re-run analysis →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

Object.assign(window, { NarrativeBrief, WatchlistAlerts });
