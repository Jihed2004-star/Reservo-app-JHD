
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/catalog';
import { getCategoryImage, HERO_IMAGE } from '../utils/images';
import Footer from '../components/Footer';

const FEATURES = [
  { title: 'Live availability', body: 'Open slots update the instant a provider publishes them — no calls, no waiting.', icon: '◷' },
  { title: 'No double-booking', body: 'Every reservation is validated against real calendar ranges before it confirms.', icon: '✓' },
  { title: 'Any vertical', body: 'From hourly studios to monthly rentals — one marketplace, any BookingUnit.', icon: '⬢' },
];
const STEPS = [
  { n:'01', title:'Pick a category', body:'Browse the marketplace by what you need, not who offers it.' },
  { n:'02', title:'Choose a service & element', body:'Drill into a provider\'s inventory — each element has its own calendar.' },
  { n:'03', title:'Select time on the calendar', body:'Drag or pick a slot that\'s guaranteed free. Instant coverage check.' },
  { n:'04', title:'Confirmed in seconds', body:'No approval queue. Your booking is locked the moment you hit confirm.' },
];

export default function Home(){
  const { data: cats } = useQuery({ queryKey:['categories'], queryFn: getCategories });
  const preview = cats?.slice(0,3) ?? [];
  return (
    <div className="bg-[#fcfcfd]">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="rounded-[32px] bg-slate-900 px-8 py-10 text-white sm:px-10 sm:py-12 lg:py-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/90 ring-1 ring-white/15">
              <span className="h-2 w-2 rounded-full bg-emerald-400"/> Live calendars · No double-bookings
            </span>
            <h1 className="font-display mt-5 text-[34px] font-extrabold leading-[0.95] tracking-tight sm:text-[46px]">
              Book any service,<br/>on <span className="text-indigo-300">your schedule.</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-6 text-slate-300">
              Reservo brings every provider\'s real availability into one marketplace. Find it, pick a time, and you\'re booked — in seconds.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/categories" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100">Browse categories →</Link>
              <a href="#how" className="rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15">How it works</a>
            </div>
            <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
              <div className="flex -space-x-2">
                {[1,2,3].map(i=> <img key={i} src={`https://i.pravatar.cc/100?img=${10+i}`} alt="" className="h-8 w-8 rounded-full ring-2 ring-slate-900 object-cover"/> )}
              </div>
              <div className="text-xs leading-tight">
                <div className="font-semibold text-white">Trusted by providers & customers</div>
                <div className="text-slate-400">Real bookings. Real reviews.</div>
              </div>
              <div className="ml-auto hidden items-center gap-1 text-amber-300 sm:flex"><span className="text-sm">★★★★★</span><span className="text-xs font-semibold text-white">4.9/5</span></div>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-2 shadow-sm">
              <img src={HERO_IMAGE} alt="People collaborating" className="h-[420px] w-full rounded-[24px] object-cover sm:h-[480px]"/>
            </div>
            {/* floating cards */}
            <div className="absolute -bottom-4 left-4 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:flex sm:items-center sm:gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">✓</div>
              <div><div className="text-sm font-bold text-slate-900">Booking confirmed</div><div className="text-xs text-slate-500">Studio A · Today 14:00–16:00</div></div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">Confirmed</span>
            </div>
            <div className="absolute -right-2 top-6 hidden rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200 sm:block">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Availability</div>
              <div className="mt-2 flex gap-1.5"><span className="h-6 w-10 rounded-lg bg-indigo-600"/><span className="h-6 w-10 rounded-lg bg-slate-100"/><span className="h-6 w-10 rounded-lg bg-indigo-600"/><span className="h-6 w-10 rounded-lg bg-slate-100"/></div>
            </div>
          </div>
        </div>
      </section>

      {/* proof */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          <span>Live in production</span>
          <span className="flex items-center gap-6">
            <span className="text-slate-900">PostgreSQL + tstzrange</span><span>•</span><span className="text-slate-900">EF Core 10</span><span>•</span><span className="text-slate-900">FullCalendar</span>
          </span>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(f=> (
            <div key={f.title} className="rounded-[22px] border border-slate-200 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white text-sm font-bold">{f.icon}</div>
              <h3 className="font-display mt-4 text-[15px] font-bold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">How it works</h2>
          <Link to="/categories" className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex">Start exploring →</Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(s=> (
            <div key={s.n} className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-6">
              <span className="text-xs font-extrabold tracking-widest text-indigo-600">{s.n}</span>
              <h3 className="mt-3 font-display text-[15px] font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* category preview with real images */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">Explore by category</h2>
              <p className="mt-1.5 max-w-md text-sm text-slate-500">Every card is a real category with a live image. Pick one to see providers and bookable elements.</p>
            </div>
            <Link to="/categories" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">View all categories</Link>
          </div>
          {preview.length>0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {preview.map(c=> (
                <Link key={c.id} to={`/categories/${c.id}/services`} className="group overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                  <div className="h-40 overflow-hidden"><img src={getCategoryImage(c.name,c.id)} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></div>
                  <div className="p-4"><div className="font-display text-sm font-bold text-slate-900">{c.name}</div><div className="mt-1 line-clamp-2 text-xs text-slate-500">{c.description ?? 'Browse services in this category.'}</div></div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[1,2,3].map(i=> <div key={i} className="h-40 animate-pulse rounded-[20px] bg-slate-100"/> )}
            </div>
          )}
        </div>
      </section>

      {/* bottom CTA */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid overflow-hidden rounded-[28px] bg-slate-900 lg:grid-cols-2">
          <div className="p-8 sm:p-10">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Ready to see what\'s bookable right now?</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">Every category is run by a real provider with a live calendar. No placeholder — check availability and lock your time.</p>
            <Link to="/categories" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100">Explore marketplace</Link>
          </div>
          <div className="relative hidden lg:block">
            <img src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=900&q=80&auto=format&fit=crop" alt="" className="h-full w-full object-cover opacity-90"/>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent"/>
          </div>
        </div>
      </section>

      <Footer/>
    </div>
  );
}
