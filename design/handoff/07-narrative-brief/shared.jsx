/* Shared primitives matching macro-impact's existing visual vocabulary */

const cx = (...xs) => xs.filter(Boolean).join(' ');

function Card({ children, className }) {
  return (
    <div className={cx('bg-white border border-zinc-200 rounded-xl shadow-sm', className)}>
      {children}
    </div>
  );
}

function Badge({ children, variant = 'gray', className }) {
  const variants = {
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    red: 'bg-red-50 text-red-600 ring-1 ring-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
    gray: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200',
    indigo: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  };
  return (
    <span className={cx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    secondary: 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-sm',
    ghost: 'hover:bg-zinc-100 text-zinc-600',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    dark: 'bg-zinc-900 hover:bg-zinc-800 text-white',
  };
  const sizes = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-sm px-5 py-2.5',
  };
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

/* Frame: simulates the app shell so each prototype feels like a real screen */
function AppFrame({ children, route = '/', width = 1080, height = 720, label }) {
  return (
    <div className="bg-white flex flex-col" style={{ width, height }}>
      {/* nav */}
      <nav className="border-b border-zinc-200 bg-white/90 backdrop-blur shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          <div className="text-zinc-900 font-semibold tracking-tight flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </span>
            Macro Impact
          </div>
          <div className="flex items-center gap-1 ml-2">
            <span className={cx('text-sm px-3 py-1.5 rounded-md transition-colors',
              route === '/' ? 'text-zinc-900 bg-zinc-100 font-medium' : 'text-zinc-500')}>Analyze</span>
            <span className={cx('text-sm px-3 py-1.5 rounded-md transition-colors',
              route === '/portfolios' ? 'text-zinc-900 bg-zinc-100 font-medium' : 'text-zinc-500')}>Portfolios</span>
            <span className={cx('text-sm px-3 py-1.5 rounded-md transition-colors',
              route === '/watchlist' ? 'text-zinc-900 bg-zinc-100 font-medium' : 'text-zinc-500')}>Watchlist</span>
            <span className={cx('text-sm px-3 py-1.5 rounded-md transition-colors',
              route === '/library' ? 'text-zinc-900 bg-zinc-100 font-medium' : 'text-zinc-500')}>Library</span>
          </div>
          {label && (
            <div className="ml-auto text-[10px] uppercase tracking-wider text-zinc-400 font-mono">{label}</div>
          )}
        </div>
      </nav>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}

/* Annotation card to explain what's new on each artboard */
function NoteCard({ kind = 'NEW', title, points = [] }) {
  const kindStyles = {
    NEW: 'bg-emerald-600 text-white',
    REVAMP: 'bg-violet-600 text-white',
    UX: 'bg-blue-600 text-white',
  };
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 max-w-md text-sm leading-relaxed">
      <div className="flex items-center gap-2 mb-2">
        <span className={cx('text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded', kindStyles[kind])}>
          {kind}
        </span>
        <h3 className="font-semibold text-zinc-900">{title}</h3>
      </div>
      <ul className="space-y-1.5 text-zinc-600">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-emerald-500 shrink-0">→</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Sample fixture data shared across prototypes */
const SAMPLE_TICKERS = [
  { ticker: 'SBUX', name: 'Starbucks', sector: 'Consumer' },
  { ticker: 'KDP',  name: 'Keurig Dr Pepper', sector: 'Consumer' },
  { ticker: 'KO',   name: 'Coca-Cola', sector: 'Consumer' },
  { ticker: 'NSRGY',name: 'Nestlé', sector: 'Consumer' },
  { ticker: 'JDE',  name: 'JDE Peet\'s', sector: 'Consumer' },
  { ticker: 'DNUT', name: 'Krispy Kreme', sector: 'Consumer' },
  { ticker: 'MCD',  name: 'McDonald\'s', sector: 'Consumer' },
  { ticker: 'CMG',  name: 'Chipotle', sector: 'Consumer' },
];

const SAMPLE_INDICATORS = [
  { ticker: 'KC=F',     name: 'Coffee Futures',    type: 'commodity' },
  { ticker: 'COP/USD',  name: 'Colombian Peso',    type: 'currency' },
  { ticker: 'DX-Y.NYB', name: 'Dollar Index',      type: 'currency' },
  { ticker: 'SU=F',     name: 'Sugar Futures',     type: 'commodity' },
  { ticker: 'CL=F',     name: 'Crude Oil',         type: 'commodity' },
];

const SAMPLE_RESULTS = [
  { ticker: 'SBUX',  name: 'Starbucks',        sector: 'Consumer', score: -3.4, conf: 'high',   reason: 'Coffee is 25% of COGS, mostly Latin American sourcing.' },
  { ticker: 'JDE',   name: 'JDE Peet\'s',      sector: 'Consumer', score: -3.1, conf: 'high',   reason: 'Pure-play coffee company, primary exposure to bean prices.' },
  { ticker: 'DNUT',  name: 'Krispy Kreme',     sector: 'Consumer', score: -1.6, conf: 'medium', reason: 'Coffee adjacency in coffee+donut bundles.' },
  { ticker: 'KDP',   name: 'Keurig Dr Pepper', sector: 'Consumer', score: -1.4, conf: 'medium', reason: 'K-Cup business exposed but diversified beverage portfolio.' },
  { ticker: 'NSRGY', name: 'Nestlé',           sector: 'Consumer', score: -0.8, conf: 'medium', reason: 'Nespresso exposure offset by global sourcing flexibility.' },
  { ticker: 'MCD',   name: 'McDonald\'s',      sector: 'Consumer', score: +0.2, conf: 'low',    reason: 'Limited coffee exposure; pricing power offsets cost.' },
  { ticker: 'KO',    name: 'Coca-Cola',        sector: 'Consumer', score: +0.4, conf: 'medium', reason: 'Costa Coffee small share; benefits if consumers shift away.' },
  { ticker: 'CMG',   name: 'Chipotle',         sector: 'Consumer', score: +0.1, conf: 'low',    reason: 'Negligible coffee exposure.' },
];

Object.assign(window, { Card, Badge, Button, AppFrame, NoteCard, cx, SAMPLE_TICKERS, SAMPLE_INDICATORS, SAMPLE_RESULTS });
