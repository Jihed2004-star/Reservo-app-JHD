import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

type Me = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
};

type Stat = {
  totalBookings: number;
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  servicesCount: number;
  elementsCount: number;
  averageRating: number;
  reviewCount: number;
};

type Br = {
  id: string;
  elementName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
};

type ProviderStats = {
  bookingsReceived: number;
  avgRating: number;
  reviewCount: number;
  servicesCount: number;
  elementsCount: number;
  revenue: number;
};

type IncomingBooking = {
  id: string;
  elementName: string;
  serviceName: string;
  customerName: string;
  startTime: string;
  status: string;
};

type ReviewReceived = {
  id: string;
  rating: number;
  comment?: string | null;
  reviewerName: string;
  elementName: string;
  createdAt: string;
};

type BookingsByDay = { date: string; count: number };

type PlatformStats = {
  totalUsers: number;
  totalProviders: number;
  totalCustomers: number;
  totalServices: number;
  totalElements: number;
  totalBookings: number;
  activeCategories: number;
  totalReviews: number;
};

type RecentUser = { id: string; fullName: string; email: string; role: string; createdAt: string };
type TopProvider = { providerId: string; providerName: string; bookingsReceived: number; avgRating: number; servicesCount: number };

type MyService = {
  id: string;
  name: string;
  isActive: boolean;
  elements: any[];
  createdAt: string;
  bookingUnit: string;
};

type Over = {
  user: Me;
  stats: Stat;
  recentBookings: Br[];
  upcomingBookings: Br[];
  myServices: MyService[];
  providerStats?: ProviderStats | null;
  recentIncomingBookings?: IncomingBooking[] | null;
  latestReviewsReceived?: ReviewReceived[] | null;
  bookingsByDay?: BookingsByDay[] | null;
  platformStats?: PlatformStats | null;
  recentUsers?: RecentUser[] | null;
  topProviders?: TopProvider[] | null;
  platformBookingsByDay?: BookingsByDay[] | null;
};

async function fetchOverview(): Promise<Over> {
  const { data } = await apiClient.get('/overview');
  return data as Over;
}

function MetricCard({ label, value, to }: { label: string; value: string | number; to?: string }) {
  const content = (
    <>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      {to && <div className="mt-1.5 text-[11px] font-semibold text-[#c25e36]">View analytics →</div>}
    </>
  );
  const className =
    'rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]';

  return to ? (
    <Link to={to} className={`${className} block transition hover:border-[#d8cdbc] hover:shadow-md`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between pb-3 border-b border-[#f0eae1]">
        <h2 className="font-serif text-sm font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="h-px flex-1 bg-[#ece6dc]" />
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-[#ece6dc]" />
    </div>
  );
}

function LineChart({ data, range, onRangeChange }: { data: BookingsByDay[]; range: '7d'|'30d'; onRangeChange: (r:'7d'|'30d')=>void }) {
  const sliced = range === '7d' ? data.slice(-7) : data;
  const max = Math.max(1, ...sliced.map((d) => d.count));
  const W = 600; const H = 172; const padL = 36, padR = 14, padT = 32, padB = 34;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const stepX = sliced.length > 1 ? chartW / (sliced.length - 1) : 0;
  const [active, setActive] = useState<number | null>(null);
  const [hoverLocked, setHoverLocked] = useState<number | null>(null);
  const total = sliced.reduce((a, b) => a + b.count, 0);
  const peak = Math.max(0, ...sliced.map((d) => d.count));
  const avg = sliced.length ? (total / sliced.length).toFixed(1) : '0';
  const getX = (i: number) => padL + i * stepX;
  const getY = (c: number) => padT + chartH - (c / max) * chartH;
  const points = sliced.map((d, i) => `${getX(i)},${getY(d.count)}`).join(' ');
  const areaPoints = `${getX(0)},${padT + chartH} ` + points + ` ${getX(sliced.length - 1)},${padT + chartH}`;
  const effectiveActive = hoverLocked !== null ? hoverLocked : active;
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-sm font-bold text-slate-900">Bookings per day</h2>
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{total}</span> total · avg {avg}/day · peak {peak}
            <span className="ml-2 hidden sm:inline text-[11px] text-slate-400">Hover or tap a point for details</span>
          </p>
        </div>
        <div className="flex items-center rounded-full border border-[#ece6dc] bg-[#fdfcfa] p-0.5">
          <button onClick={() => onRangeChange('7d')} className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${range === '7d' ? 'bg-white shadow-sm border border-[#ece6dc] text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>7d</button>
          <button onClick={() => onRangeChange('30d')} className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${range === '30d' ? 'bg-white shadow-sm border border-[#ece6dc] text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>30d</button>
        </div>
      </div>

      <div className="relative mt-4 select-none" onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[168px] w-full overflow-visible" role="img" aria-label="Bookings per day chart">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d9653b" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#d9653b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* grid */}
          {[0, 1, 2, 3, 4].map((ti) => {
            const y = padT + (chartH / 4) * ti;
            const v = Math.round(max - (max / 4) * ti);
            return (
              <g key={ti}>
                <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#f0eae1" strokeDasharray={ti === 4 ? '0' : '3 5'} strokeWidth={ti === 4 ? 1 : 0.9} />
                <text x={padL - 8} y={y + 3.5} textAnchor="end" fontSize="10" fontWeight={700} fill="#94a3b8">{v}</text>
              </g>
            );
          })}
          {/* area */}
          <polygon points={areaPoints} fill="url(#areaGrad)" />
          {/* line */}
          <polyline fill="none" stroke="#d9653b" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" points={points} />
          {/* vertical guide */}
          {effectiveActive !== null && (
            <line x1={getX(effectiveActive)} x2={getX(effectiveActive)} y1={padT} y2={padT + chartH} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4 4" opacity={0.9} />
          )}
          {/* points + count pills */}
          {sliced.map((d, i) => {
            const x = getX(i);
            const y = getY(d.count);
            const isActive = effectiveActive === i;
            const showLabel = range === '7d' ? true : d.count > 0 || isActive;
            const labelW = d.count > 9 ? 22 : 18;
            const labelH = 16;
            const labelY = y - 18;
            return (
              <g key={d.date} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} tabIndex={0}>
                {/* larger hit area */}
                <rect x={x - Math.max(10, stepX/2)} y={padT} width={Math.max(20, stepX)} height={chartH} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => setHoverLocked(hoverLocked === i ? null : i)} />
                {showLabel && (
                  <g>
                    <rect x={x - labelW/2} y={labelY - labelH/2} width={labelW} height={labelH} rx={8} fill={isActive ? '#0f172a' : 'white'} stroke={isActive ? '#0f172a' : '#ece6dc'} />
                    <text x={x} y={labelY + 3.5} textAnchor="middle" fontSize="10" fontWeight={800} fill={isActive ? 'white' : '#334155'}>{d.count}</text>
                  </g>
                )}
                <circle cx={x} cy={y} r={isActive ? 5.2 : 3.6} fill={isActive ? '#0f172a' : '#d9653b'} stroke="white" strokeWidth={1.6} style={{ transition: 'r 120ms, fill 120ms', filter: isActive ? 'drop-shadow(0 1px 4px rgba(15,23,42,0.25))' : undefined }} />
                {isActive && <circle cx={x} cy={y} r={10} fill="#d9653b" opacity={0.12} />}
              </g>
            );
          })}
          {/* x labels */}
          {sliced.map((d, i) => {
            const x = getX(i);
            const every = range === '30d' ? Math.ceil(sliced.length / 7) : 1;
            const show = i % every === 0 || i === sliced.length - 1;
            if (!show) return null;
            const lab = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const isActive = effectiveActive === i;
            return <text key={d.date} x={x} y={H - 8} textAnchor="middle" fontSize="10.5" fontWeight={isActive ? 800 : 600} fill={isActive ? '#0f172a' : '#94a3b8'}>{lab}</text>;
          })}
        </svg>

        {/* floating tooltip - HTML for crisp text & interactivity */}
        {effectiveActive !== null && sliced[effectiveActive] && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-[#ece6dc] bg-white px-3 py-2 shadow-lg"
            style={{ left: `${(getX(effectiveActive) / W) * 100}%`, top: `${getY(sliced[effectiveActive].count) - 56}px`, minWidth: '132px' }}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{new Date(sliced[effectiveActive].date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold leading-none tracking-tight text-slate-900">{sliced[effectiveActive].count}</span>
              <span className="text-xs font-semibold text-slate-500">{sliced[effectiveActive].count === 1 ? 'booking' : 'bookings'}</span>
            </div>
          </div>
        )}
      </div>

      {/* legend / helper */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ece6dc] bg-[#fdfcfa] px-2.5 py-1 font-semibold text-slate-600"><span className="inline-block h-2 w-2 rounded-full bg-[#d9653b]" /> bookings</span>
        <span className="text-slate-400">Tap a point to pin · Tap again to unpin · Counts shown above each point</span>
      </div>
    </div>
  );
}

function BookingList({ bookings, emptyText }: { bookings: Br[]; emptyText: string }) {
  if (bookings.length===0) return <p className="py-6 text-center text-xs text-slate-400">{emptyText}</p>;
  return (
    <ul className="divide-y divide-[#f0eae1]">
      {bookings.map(b=> (
        <li key={b.id} className="flex items-center justify-between py-2.5">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">{b.elementName}</div>
            <div className="text-xs text-slate-400 truncate">{b.serviceName} · {new Date(b.startTime).toLocaleString()}</div>
          </div>
          <span className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.status==='Cancelled' ? 'bg-rose-50 text-rose-700' : b.status==='Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#fdfcfa] border border-[#ece6dc] text-slate-700'}`}>{b.status}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const [chartRange, setChartRange] = useState<'7d'|'30d'>('7d');
  const [platformRange, setPlatformRange] = useState<'7d'|'30d'>('7d');

  const { data, isLoading, error } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview, enabled: !!user });

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <p className="text-sm text-slate-500">Please <Link to="/login" className="font-semibold text-[#c25e36] underline">sign in</Link> to see your overview.</p>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[1,2,3,4,5].map(i=> <div key={i} className="h-28 animate-pulse rounded-2xl bg-white border border-[#ece6dc]" />)}</div>
        <div className="h-40 animate-pulse rounded-2xl bg-white border border-[#ece6dc]" />
        <div className="grid gap-6 lg:grid-cols-2"><div className="h-64 animate-pulse rounded-2xl bg-white border border-[#ece6dc]" /><div className="h-64 animate-pulse rounded-2xl bg-white border border-[#ece6dc]" /></div>
      </div>
    );
  }
  if (error || !data) {
    return <div className="mx-auto max-w-6xl px-6 py-8"><div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">Could not load overview. Please try again.</div></div>;
  }

  const s = data.stats;
  const role = data.user.role;
  const isProvider = role === 'Provider';
  const isAdmin = role === 'Admin';
  const isCustomer = !isProvider && !isAdmin;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
      {isCustomer && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <MetricCard label="Total Bookings" value={s.totalBookings} />
            <MetricCard label="Upcoming" value={s.upcomingCount} />
            <MetricCard label="Completed" value={s.completedCount} />
            <MetricCard label="Cancelled" value={s.cancelledCount} />
            <MetricCard label="Reviews Given" value={s.reviewCount} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Upcoming bookings" action={<Link to="/my-bookings" className="text-xs font-semibold text-[#c25e36] hover:underline">View all</Link>}>
              <BookingList bookings={data.upcomingBookings} emptyText="No upcoming bookings scheduled." />
            </SectionCard>
            <SectionCard title="Recent bookings" action={<Link to="/my-bookings" className="text-xs font-semibold text-[#c25e36] hover:underline">History</Link>}>
              {data.recentBookings.length===0 ? <p className="py-6 text-center text-xs text-slate-400">No bookings yet. <Link to="/categories" className="text-[#c25e36] underline">Explore services</Link></p> : <BookingList bookings={data.recentBookings} emptyText="" />}
            </SectionCard>
          </div>
        </>
      )}

      {isProvider && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <MetricCard label="Bookings Received" value={data.providerStats?.bookingsReceived ?? 0} />
            <MetricCard label="Services" value={data.providerStats?.servicesCount ?? s.servicesCount ?? 0} />
            <MetricCard label="Elements" value={data.providerStats?.elementsCount ?? s.elementsCount ?? 0} />
            <MetricCard label="Avg Rating" value={data.providerStats?.avgRating ? data.providerStats.avgRating.toFixed(1) : (s.averageRating ? s.averageRating.toFixed(1) : '—')} />
            <MetricCard label="Revenue" value={`$${Number(data.providerStats?.revenue ?? 0).toFixed(2)}`} to="/provider/revenue" />
          </div>

          {data.bookingsByDay && data.bookingsByDay.length>0 && (
            <LineChart data={data.bookingsByDay} range={chartRange} onRangeChange={setChartRange} />
          )}

          <SectionCard title="My services" action={<Link to="/provider/dashboard" className="text-xs font-semibold text-[#c25e36] hover:underline">Manage</Link>}>
            {!data.myServices || data.myServices.length===0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No services yet. <Link to="/provider/services/new" className="text-[#c25e36] underline">Create one</Link></p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    <tr><th className="pb-2 font-bold">Service</th><th className="pb-2 font-bold">Elements</th><th className="pb-2 font-bold">Status</th><th className="pb-2 font-bold">Avg Rating</th><th className="pb-2 font-bold"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eae1]">
                    {data.myServices.map((svc:any)=> (
                      <tr key={svc.id} className="hover:bg-[#fdfcfa]">
                        <td className="py-2.5 font-semibold text-slate-900">{svc.name}</td>
                        <td className="py-2.5 text-slate-600">{svc.elements?.length ?? 0}</td>
                        <td className="py-2.5">{svc.isActive ? <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Active</span> : <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">Inactive</span>}</td>
                        <td className="py-2.5 text-slate-600">{data.providerStats?.avgRating ? data.providerStats.avgRating.toFixed(1) : '—'}</td>
                        <td className="py-2.5 text-right"><Link to={`/provider/services/${svc.id}`} className="text-xs font-semibold text-[#c25e36] hover:underline">Manage</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Recent incoming bookings">
              {!data.recentIncomingBookings || data.recentIncomingBookings.length===0 ? <p className="py-6 text-center text-xs text-slate-400">No incoming bookings yet.</p> : (
                <ul className="divide-y divide-[#f0eae1]">
                  {data.recentIncomingBookings.map(b=> (
                    <li key={b.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{b.elementName}</div>
                        <div className="text-xs text-slate-400 truncate">{b.serviceName} · {b.customerName} · {new Date(b.startTime).toLocaleString()}</div>
                      </div>
                      <span className="ml-3 shrink-0 rounded-full bg-[#fdfcfa] border border-[#ece6dc] px-2.5 py-0.5 text-xs font-semibold text-slate-700">{b.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
            <SectionCard title="Latest reviews received">
              {!data.latestReviewsReceived || data.latestReviewsReceived.length===0 ? <p className="py-6 text-center text-xs text-slate-400">No reviews yet.</p> : (
                <ul className="divide-y divide-[#f0eae1]">
                  {data.latestReviewsReceived.map(r=> (
                    <li key={r.id} className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#d9653b]">{r.rating}★</span>
                        <span className="text-sm font-semibold text-slate-900 truncate">{r.elementName}</span>
                        <span className="ml-auto text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      {r.comment && <div className="mt-1 text-xs text-slate-600 line-clamp-2">{r.comment}</div>}
                      <div className="text-xs text-slate-400">by {r.reviewerName}</div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <Divider label="── My activity as a user ──" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="My Bookings" value={s.totalBookings} />
            <MetricCard label="Upcoming" value={s.upcomingCount} />
            <MetricCard label="Completed" value={s.completedCount} />
            <MetricCard label="Cancelled" value={s.cancelledCount} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Upcoming bookings (as customer)" action={<Link to="/my-bookings" className="text-xs font-semibold text-[#c25e36] hover:underline">View all</Link>}>
              <BookingList bookings={data.upcomingBookings} emptyText="No upcoming bookings scheduled." />
            </SectionCard>
            <SectionCard title="Recent bookings (as customer)" action={<Link to="/my-bookings" className="text-xs font-semibold text-[#c25e36] hover:underline">History</Link>}>
              {data.recentBookings.length===0 ? <p className="py-6 text-center text-xs text-slate-400">No bookings yet. <Link to="/categories" className="text-[#c25e36] underline">Explore services</Link></p> : <BookingList bookings={data.recentBookings} emptyText="" />}
            </SectionCard>
          </div>
        </>
      )}

      {isAdmin && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <MetricCard label="Total Users" value={data.platformStats?.totalUsers ?? 0} />
            <MetricCard label="Total Services" value={data.platformStats?.totalServices ?? 0} />
            <MetricCard label="Total Bookings" value={data.platformStats?.totalBookings ?? 0} />
            <MetricCard label="Active Categories" value={data.platformStats?.activeCategories ?? 0} />
            <MetricCard label="Total Reviews" value={data.platformStats?.totalReviews ?? 0} />
          </div>

          {data.platformBookingsByDay && data.platformBookingsByDay.length>0 && (
            <LineChart data={data.platformBookingsByDay} range={platformRange} onRangeChange={setPlatformRange} />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Recent new users">
              {!data.recentUsers || data.recentUsers.length===0 ? <p className="py-6 text-center text-xs text-slate-400">No users yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      <tr><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0eae1]">
                      {data.recentUsers.map(u=> (
                        <tr key={u.id} className="hover:bg-[#fdfcfa]">
                          <td className="py-2.5 font-semibold text-slate-900">{u.fullName}</td>
                          <td className="py-2.5 text-slate-600 truncate max-w-[160px]">{u.email}</td>
                          <td className="py-2.5"><span className="rounded-full border border-[#ece6dc] bg-[#fdfcfa] px-2.5 py-0.5 text-xs font-semibold text-slate-700">{u.role}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
            <SectionCard title="Top providers">
              {!data.topProviders || data.topProviders.length===0 ? <p className="py-6 text-center text-xs text-slate-400">No providers yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      <tr><th className="pb-2">Provider</th><th className="pb-2">Bookings</th><th className="pb-2">Avg Rating</th><th className="pb-2">Services</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0eae1]">
                      {data.topProviders.map(p=> (
                        <tr key={p.providerId} className="hover:bg-[#fdfcfa]">
                          <td className="py-2.5 font-semibold text-slate-900">{p.providerName}</td>
                          <td className="py-2.5 text-slate-600">{p.bookingsReceived}</td>
                          <td className="py-2.5 text-slate-600">{p.avgRating ? p.avgRating.toFixed(1) : '—'}</td>
                          <td className="py-2.5 text-slate-600">{p.servicesCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>

          <Divider label="── My activity as a user ──" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="My Bookings" value={s.totalBookings} />
            <MetricCard label="Upcoming" value={s.upcomingCount} />
            <MetricCard label="Completed" value={s.completedCount} />
            <MetricCard label="Cancelled" value={s.cancelledCount} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Upcoming bookings (as customer)" action={<Link to="/my-bookings" className="text-xs font-semibold text-[#c25e36] hover:underline">View all</Link>}>
              <BookingList bookings={data.upcomingBookings} emptyText="No upcoming bookings scheduled." />
            </SectionCard>
            <SectionCard title="Recent bookings (as customer)" action={<Link to="/my-bookings" className="text-xs font-semibold text-[#c25e36] hover:underline">History</Link>}>
              {data.recentBookings.length===0 ? <p className="py-6 text-center text-xs text-slate-400">No bookings yet. <Link to="/categories" className="text-[#c25e36] underline">Explore services</Link></p> : <BookingList bookings={data.recentBookings} emptyText="" />}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
