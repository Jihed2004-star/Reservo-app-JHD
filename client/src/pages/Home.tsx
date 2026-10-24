

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/catalog';
import { categoryImage, HERO_IMAGE } from '../utils/images';
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
              Reservo brings every provider&apos;s real availability into one marketplace. Find it, pick a time, and you&apos;re booked — in seconds.
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
                  <div className="h-40 overflow-hidden"><img src={categoryImage(c)} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></div>
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

            {/* Ready in about a minute */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700">Get started</span>
          <h2 className="font-display mx-auto mt-3 max-w-2xl text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Ready in about a minute</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">No sales call. No onboarding queue. Create your account and make your first booking — or publish your first service — in under 60 seconds.</p>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" strokeLinecap="round"/><path d="M16 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="mt-3 text-xs font-extrabold uppercase tracking-widest text-indigo-600">For customers</span>
            <h3 className="font-display mt-1 text-lg font-bold text-slate-900">Book your first slot</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">1</span><span><strong className="text-slate-900">Sign up</strong> — email + password, 10 seconds.</span></li>
              <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">2</span><span><strong className="text-slate-900">Pick a service</strong> — browse categories, open any element calendar.</span></li>
              <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">3</span><span><strong className="text-slate-900">Confirm</strong> — choose your time, hit book. Done.</span></li>
            </ol>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link to="/register" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">Create account</Link>
              <Link to="/categories" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Browse now</Link>
            </div>
            <p className="mt-3 text-xs text-slate-400">Free to join · No credit card required to browse</p>
          </div>
          <div className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h6" strokeLinecap="round"/></svg></span>
            <span className="mt-3 text-xs font-extrabold uppercase tracking-widest text-emerald-600">For providers</span>
            <h3 className="font-display mt-1 text-lg font-bold text-slate-900">Publish your inventory</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">1</span><span><strong className="text-slate-900">Register as Provider</strong> — same sign-up, choose Provider role.</span></li>
              <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">2</span><span><strong className="text-slate-900">Create a service & elements</strong> — name, price, calendar unit.</span></li>
              <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">3</span><span><strong className="text-slate-900">Go live</strong> — availability is instant, bookings roll in.</span></li>
            </ol>
            <div className="mt-6"><Link to="/register" className="inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Start as provider</Link></div>
            <p className="mt-3 text-xs text-slate-400">List up to 5 elements free · Keep 100% during beta</p>
          </div>
          <div className="flex flex-col rounded-[24px] bg-slate-900 p-6 text-white">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">Timeline</span>
            <h3 className="font-display mt-2 text-lg font-bold">From zero to booked</h3>
            <div className="relative mt-6 space-y-0 pl-6">
              <div className="absolute bottom-6 left-[11px] top-2 w-px bg-white/15"/>
              <div className="relative flex gap-3 pb-5"><span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">0s</span><div><div className="text-sm font-semibold">Land on Reservo</div><div className="text-xs text-slate-400">Everything&apos;s already live</div></div></div>
              <div className="relative flex gap-3 pb-5"><span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">15s</span><div><div className="text-sm font-semibold">Choose what you need</div><div className="text-xs text-slate-400">Category → service → calendar</div></div></div>
              <div className="relative flex gap-3 pb-5"><span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">45s</span><div><div className="text-sm font-semibold">Lock your time</div><div className="text-xs text-slate-400">Validated slot, instant confirmation</div></div></div>
              <div className="relative flex gap-3"><span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-slate-900">60s</span><div><div className="text-sm font-semibold text-amber-300">You&apos;re booked</div><div className="text-xs text-slate-400">Email confirmation + calendar invite</div></div></div>
            </div>
            <Link to="/categories" className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-100">Try it now →</Link>
          </div>
        </div>
      </section>


      {/* Common questions */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-500">FAQ</span>
              <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Common questions</h2>
              <p className="mt-1.5 max-w-md text-sm text-slate-500">Everything you need to know before you book — or list.</p>
            </div>
            <Link to="/categories" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">Explore marketplace</Link>
          </div>
          <CommonQuestions />
        </div>
      </section>


      {/* bottom CTA */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid overflow-hidden rounded-[28px] bg-slate-900 lg:grid-cols-2">
          <div className="p-8 sm:p-10">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Ready to see what&apos;s bookable right now?</h2>
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

const FAQ_ITEMS = [
  {
    q: "How does Reservo prevent double-bookings?",
    a: "Every booking is checked against real tstzrange availability with an exclusion constraint in Postgres. If an overlapping reservation exists, the database rejects it — so no two confirmed bookings can ever share the same time.",
  },
  {
    q: "Can I browse without an account?",
    a: "Yes. Categories, services, and element calendars are public. You only need an account when you confirm a booking or publish your own service.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Customers and providers can cancel confirmed bookings from My Bookings or the element page. Cancelled slots become available again instantly.",
  },
  {
    q: "How does pricing work across different booking units?",
    a: "Each service defines its BookingUnit — Hourly, Daily, or Monthly — and each element sets its own price for that unit. What you see on the calendar is what you pay for the selected interval.",
  },
  {
    q: "How do reviews and ratings work?",
    a: "After a completed booking, you can leave a star rating and comment. Element pages show the aggregate rating and all reviews for that inventory item.",
  },
  {
    q: "How do I list my own service as a provider?",
    a: "Register and choose the Provider role. Then create a service, add elements with price and attributes, and generate availability. Your inventory goes live immediately.",
  },
  {
    q: "Is there a fee to use Reservo?",
    a: "Browsing and booking are free for customers. Providers can list up to 5 elements free during beta and keep 100% of their bookings — no commissions while we validate the marketplace.",
  },
];

function CommonQuestions() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
      {FAQ_ITEMS.map((item, idx) => (
        <div key={idx} className="bg-white first:rounded-t-2xl last:rounded-b-2xl">
          <button
            onClick={() => setOpen(open === idx ? null : idx)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-sm font-semibold text-slate-900">{item.q}</span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600">
              {open === idx ? "−" : "+"}
            </span>
          </button>
          {open === idx && (
            <div className="px-5 pb-4 text-sm leading-6 text-slate-600">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

