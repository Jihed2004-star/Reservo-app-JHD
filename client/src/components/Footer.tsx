import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_.8fr_.8fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-900">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                  <path d="M3 9.5h18" strokeLinecap="round" />
                  <path d="M8 3v3M16 3v3" strokeLinecap="round" />
                  <path d="M8.5 14l2 2 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight text-white">Reservo</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/80">Marketplace</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              The vertical-agnostic booking platform. Discover services, check live availability, and confirm in seconds — no double bookings, ever.
            </p>
            <div className="mt-6 flex gap-2">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white hover:text-slate-900 transition">𝕏</a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white hover:text-slate-900 transition">in</a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white hover:text-slate-900 transition">◎</a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Explore</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/categories" className="text-slate-400 hover:text-white">Categories</Link></li>
              <li><Link to="/my-bookings" className="text-slate-400 hover:text-white">My bookings</Link></li>
              <li><Link to="/provider/dashboard" className="text-slate-400 hover:text-white">For providers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Company</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-white">How it works</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white">Pricing</a></li>
              <li><a href="mailto:support@reservo.app" className="text-slate-400 hover:text-white">support@reservo.app</a></li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-5 text-slate-900">
            <h4 className="font-display text-sm font-bold">Get booking updates</h4>
            <p className="mt-1 text-xs text-slate-500">New categories & provider highlights, once a month.</p>
            <div className="mt-4 flex gap-2">
              <input placeholder="Your email" className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none" />
              <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-black">Join</button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <span>© {year} Reservo. Crafted for real calendars, real services.</span>
          <span className="flex items-center gap-3">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
