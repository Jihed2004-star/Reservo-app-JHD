import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  getProviderRevenue,
  type RevenueTransaction,
} from '../api/revenue';
import { useAuth } from '../context/AuthContext';
import { Badge, statusToVariant } from '../components/ui/Badge';

type RangeKey = '7d' | '30d' | '12m';
type StatusFilter = 'All' | 'Completed' | 'Upcoming' | 'Cancelled';

type ChartPoint = {
  key: string;
  axisLabel: string;
  tooltipLabel: string;
  revenue: number;
  bookingsCount: number;
};

const money = (value: number) =>
  `$${Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const compactMoney = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return `$${Math.round(value)}`;
};

/** "2026-10-21" → local Date, avoiding the UTC-midnight day shift. */
function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** Rounds a max value up to a chart-friendly axis ceiling. */
function niceMax(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function downloadCsv(rows: RevenueTransaction[]) {
  const header = ['Date', 'Booking', 'Customer', 'Service', 'Element', 'Duration', 'Unit price', 'Amount', 'Status'];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((t) =>
    [
      new Date(t.startTime).toISOString().slice(0, 10),
      t.bookingCode,
      t.customerName,
      t.serviceName,
      t.elementName,
      t.durationFormatted,
      t.unitPrice.toFixed(2),
      t.totalAmount.toFixed(2),
      t.status,
    ]
      .map(escape)
      .join(','),
  );

  // The BOM keeps Excel from mangling accented names.
  const blob = new Blob([`\uFEFF${[header.join(','), ...lines].join('\r\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `provider-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function KpiCard({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-bold tracking-tight ${valueClass ?? 'text-slate-900'}`}>{value}</div>
      {hint ? <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function GrowthBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${
        up
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-rose-50 text-rose-600 ring-rose-200'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
        {up ? (
          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      {value > 0 ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
  bodyClassName = 'p-5',
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function RevenueChart({ points }: { points: ChartPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const W = 760;
  const H = 280;
  const padL = 62;
  const padR = 20;
  const padT = 26;
  const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const max = niceMax(Math.max(0, ...points.map((p) => p.revenue)));
  const stepX = points.length > 1 ? chartW / (points.length - 1) : 0;
  const getX = (index: number) => padL + index * stepX;
  const getY = (value: number) => padT + chartH - (value / max) * chartH;

  const line = points.map((p, i) => `${getX(i)},${getY(p.revenue)}`).join(' ');
  const area = points.length
    ? `${getX(0)},${padT + chartH} ${line} ${getX(points.length - 1)},${padT + chartH}`
    : '';

  const total = points.reduce((sum, p) => sum + p.revenue, 0);
  const totalBookings = points.reduce((sum, p) => sum + p.bookingsCount, 0);
  const peak = Math.max(0, ...points.map((p) => p.revenue));
  const active = pinned ?? hovered;
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));

  if (points.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
        No revenue recorded yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>
          <span className="font-bold text-slate-900">{money(total)}</span> earned in this window
        </span>
        <span className="text-slate-300">·</span>
        <span>
          <span className="font-semibold text-slate-700">{totalBookings}</span>{' '}
          {totalBookings === 1 ? 'booking' : 'bookings'}
        </span>
        <span className="text-slate-300">·</span>
        <span>
          best <span className="font-semibold text-slate-700">{money(peak)}</span>
        </span>
      </div>

      {/* Matching the viewBox ratio means the SVG fills its box exactly, so the
          percentage-based tooltip lands on the right point at every width. */}
      <div
        className="relative mt-2 w-full select-none"
        style={{ aspectRatio: `${W} / ${H}` }}
        onMouseLeave={() => setHovered(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Revenue over time">
          <defs>
            <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          {/* horizontal grid + y-axis labels */}
          {[0, 1, 2, 3, 4].map((tick) => {
            const y = padT + (chartH / 4) * tick;
            const value = max - (max / 4) * tick;
            return (
              <g key={tick}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke={tick === 4 ? '#cbd5e1' : '#eef2f7'}
                  strokeWidth={1}
                />
                <text x={padL - 10} y={y + 3.5} textAnchor="end" fontSize="10.5" fontWeight={600} fill="#94a3b8">
                  {compactMoney(value)}
                </text>
              </g>
            );
          })}

          <polygon points={area} fill="url(#revenueAreaGrad)" />
          <polyline
            points={line}
            fill="none"
            stroke="#4f46e5"
            strokeWidth={2.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* hover bands: easier to hit than the dots themselves */}
          {points.map((p, i) => {
            const band = points.length > 1 ? stepX : chartW;
            const x = Math.max(padL, getX(i) - band / 2);
            return (
              <rect
                key={`band-${p.key}`}
                x={x}
                y={padT}
                width={band}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onClick={() => setPinned((current) => (current === i ? null : i))}
              />
            );
          })}

          {active !== null && (
            <line
              x1={getX(active)}
              x2={getX(active)}
              y1={padT}
              y2={padT + chartH}
              stroke="#c7d2fe"
              strokeDasharray="3 4"
            />
          )}

          {/* dots */}
          {points.map((p, i) => {
            const isActive = active === i;
            return (
              <g key={`dot-${p.key}`} className="pointer-events-none">
                {isActive && <circle cx={getX(i)} cy={getY(p.revenue)} r={9} fill="#4f46e5" opacity={0.12} />}
                <circle
                  cx={getX(i)}
                  cy={getY(p.revenue)}
                  r={isActive ? 5 : 3.2}
                  fill={isActive ? '#312e81' : '#ffffff'}
                  stroke={isActive ? '#312e81' : '#4f46e5'}
                  strokeWidth={2}
                  style={{ transition: 'r 120ms, fill 120ms' }}
                />
              </g>
            );
          })}

          {/* x-axis labels */}
          {points.map((p, i) => {
            if (i % labelEvery !== 0 && i !== points.length - 1) return null;
            return (
              <text
                key={`label-${p.key}`}
                x={getX(i)}
                y={H - 12}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight={active === i ? 800 : 600}
                fill={active === i ? '#0f172a' : '#94a3b8'}
              >
                {p.axisLabel}
              </text>
            );
          })}
        </svg>

        {active !== null && points[active] && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg"
            style={{
              left: `${Math.min(86, Math.max(14, (getX(active) / W) * 100))}%`,
              top: `${(getY(points[active].revenue) / H) * 100}%`,
              marginTop: '-78px',
              minWidth: '150px',
            }}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {points[active].tooltipLabel}
            </div>
            <div className="mt-1 text-lg font-extrabold leading-none tracking-tight text-slate-900">
              {money(points[active].revenue)}
            </div>
            <div className="mt-1 text-[11px] font-medium text-slate-500">
              {points[active].bookingsCount}{' '}
              {points[active].bookingsCount === 1 ? 'completed booking' : 'completed bookings'}
            </div>
          </div>
        )}

        {total === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-500">
              No completed bookings in this period
            </span>
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        Tap a point to pin the tooltip · revenue is counted when a booking's window ends
      </p>
    </div>
  );
}

const unitNoun = (unit: string) =>
  unit === 'Hourly' ? 'hour' : unit === 'Daily' ? 'day' : unit === 'Monthly' ? 'month' : 'unit';

const formatUnits = (value: number) =>
  Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 1,
  });

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '12m', label: '12 Months' },
];

const FILTERS: StatusFilter[] = ['All', 'Completed', 'Upcoming', 'Cancelled'];

export default function ProviderRevenue() {
  const { user } = useAuth();
  const canView = user?.role === 'Provider' || user?.role === 'Admin';

  const [range, setRange] = useState<RangeKey>('30d');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['providerRevenue'],
    queryFn: getProviderRevenue,
    enabled: canView,
  });

  const transactions = useMemo(() => data?.transactions ?? [], [data]);

  const filteredTransactions = useMemo(() => {
    const rows = data?.transactions ?? [];
    const query = search.trim().toLowerCase();

    return rows.filter((t) => {
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Upcoming' ? t.status === 'Confirmed' : t.status === statusFilter);

      const matchesSearch =
        query.length === 0 ||
        t.customerName.toLowerCase().includes(query) ||
        t.elementName.toLowerCase().includes(query) ||
        t.serviceName.toLowerCase().includes(query) ||
        t.bookingCode.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [data, statusFilter, search]);

  const chartPoints = useMemo<ChartPoint[]>(() => {
    if (!data) return [];

    if (range === '12m') {
      return data.monthlyRevenue.map((m) => ({
        key: m.month,
        // "Oct 2026" → "Oct" on the axis, the full label in the tooltip.
        axisLabel: m.month.split(' ')[0],
        tooltipLabel: m.month,
        revenue: m.revenue,
        bookingsCount: m.bookingsCount,
      }));
    }

    const days = range === '7d' ? data.dailyRevenue.slice(-7) : data.dailyRevenue;
    return days.map((d) => {
      const date = parseIsoDate(d.date);
      return {
        key: d.date,
        axisLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        tooltipLabel: date.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        revenue: d.revenue,
        bookingsCount: d.bookingsCount,
      };
    });
  }, [data, range]);

  const counts = useMemo(
    () => ({
      All: transactions.length,
      Completed: transactions.filter((t) => t.status === 'Completed').length,
      Upcoming: transactions.filter((t) => t.status === 'Confirmed').length,
      Cancelled: transactions.filter((t) => t.status === 'Cancelled').length,
    }),
    [transactions],
  );

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-sm text-slate-500">
          Please{' '}
          <Link to="/login" className="font-semibold text-indigo-600 underline">
            sign in
          </Link>{' '}
          to see your revenue.
        </p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-slate-500">You don't have access to this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-white" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Could not load your revenue. Please try again.
        </div>
      </div>
    );
  }

  const f = data.financials;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Revenue &amp; Sales Analytics
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Completed earnings, confirmed pipeline and per-element performance across everything you
            offer.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/provider/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            My services
          </Link>
          <button
            type="button"
            onClick={() => downloadCsv(filteredTransactions)}
            disabled={filteredTransactions.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total Net Earned"
          value={money(f.totalEarned)}
          hint={
            <>
              {f.completedBookingsCount}{' '}
              {f.completedBookingsCount === 1 ? 'completed booking' : 'completed bookings'}
            </>
          }
        />
        <KpiCard
          label="Pipeline / Upcoming"
          value={money(f.upcomingRevenue)}
          valueClass="text-indigo-600"
          hint={
            <>
              {f.upcomingBookingsCount} confirmed{' '}
              {f.upcomingBookingsCount === 1 ? 'booking' : 'bookings'} not yet delivered
            </>
          }
        />
        <KpiCard
          label="This Month"
          value={money(f.thisMonthRevenue)}
          hint={
            <>
              <GrowthBadge value={f.monthOverMonthGrowth} />
              <span>vs {money(f.lastMonthRevenue)} last month</span>
            </>
          }
        />
        <KpiCard
          label="Average Order Value"
          value={money(f.averageBookingValue)}
          hint="Per completed booking"
        />
        <KpiCard
          label="Lost to Cancellations"
          value={money(f.cancelledRevenue)}
          valueClass="text-rose-600"
          hint={
            <>
              {f.cancelledBookingsCount}{' '}
              {f.cancelledBookingsCount === 1 ? 'booking' : 'bookings'} cancelled
            </>
          }
        />
      </div>

      {/* Revenue over time */}
      <Panel
        title="Revenue over time"
        subtitle="Completed revenue per period — cancelled bookings are excluded."
        action={
          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5">
            {RANGES.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  range === option.key
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        <RevenueChart points={chartPoints} />
      </Panel>

      {/* Element performance */}
      <Panel
        title="Element performance"
        subtitle="Where your revenue comes from, highest earning first."
        bodyClassName="p-0"
      >
        {data.elementBreakdown.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No elements yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add elements to a service and your revenue breakdown will appear here.
            </p>
            <Link
              to="/provider/services/new"
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              + New service
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Element</th>
                  <th className="px-5 py-3 font-semibold">Unit price</th>
                  <th className="px-5 py-3 text-right font-semibold">Bookings</th>
                  <th className="px-5 py-3 text-right font-semibold">Units sold</th>
                  <th className="px-5 py-3 text-right font-semibold">Revenue</th>
                  <th className="px-5 py-3 font-semibold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.elementBreakdown.map((element) => (
                  <tr key={element.elementId} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{element.elementName}</div>
                      <div className="text-xs text-slate-400">{element.serviceName}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                      {money(element.unitPrice)}
                      <span className="text-xs text-slate-400"> / {unitNoun(element.bookingUnit)}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {element.completedBookingsCount}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {formatUnits(element.totalUnitsSold)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold whitespace-nowrap text-slate-900">
                      {money(element.totalRevenue)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${Math.min(100, Math.max(0, element.percentageOfTotal))}%` }}
                          />
                        </div>
                        <span className="w-11 text-xs font-semibold text-slate-600">
                          {element.percentageOfTotal.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Sales ledger */}
      <Panel
        title="Detailed sales ledger"
        subtitle={
          data.transactions.length === 0
            ? 'Bookings on your elements will appear here.'
            : `Your latest ${data.transactions.length} bookings, newest first.`
        }
        bodyClassName="p-0"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-fit flex-wrap items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 p-0.5">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                title={filter === 'Upcoming' ? 'Confirmed bookings that have not finished yet' : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === filter
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {filter}
                <span className="ml-1.5 text-[11px] font-medium text-slate-400">{counts[filter]}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:flex-none">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer or element"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 lg:w-64"
              />
            </div>
            <button
              type="button"
              onClick={() => downloadCsv(filteredTransactions)}
              disabled={filteredTransactions.length === 0}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export to CSV
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No bookings match</p>
            <p className="mt-1 text-sm text-slate-500">Try another filter or clear your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Service &amp; element</th>
                  <th className="px-5 py-3 font-semibold">Duration</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {new Date(t.startTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(t.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{t.customerName}</div>
                      <div className="text-xs text-slate-400">{t.bookingCode}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{t.elementName}</div>
                      <div className="text-xs text-slate-400">{t.serviceName}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600">{t.durationFormatted}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{money(t.totalAmount)}</div>
                      <div className="text-xs text-slate-400">{money(t.unitPrice)} / unit</div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={statusToVariant(t.status)}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

