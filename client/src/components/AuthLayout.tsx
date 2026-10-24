import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AUTH_IMAGE_LOGIN, AUTH_IMAGE_REGISTER } from '../utils/images';

interface AuthLayoutProps { illustrationSide: 'left' | 'right'; children: ReactNode; }

export default function AuthLayout({ illustrationSide, children }: AuthLayoutProps){
  const image = illustrationSide==='left' ? AUTH_IMAGE_REGISTER : AUTH_IMAGE_LOGIN;
  const form = (
    <div className="w-full lg:w-[520px] flex items-center justify-center px-6 py-10 lg:px-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-extrabold tracking-tight text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18" strokeLinecap="round"/><path d="M8 3v3M16 3v3" strokeLinecap="round"/><path d="M8.5 14l2 2 4.5-4.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          Reservo
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold tracking-widest text-white">MARKETPLACE</span>
        </Link>
        {children}
      </div>
    </div>
  );
  const visual = (
    <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90"/>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"/>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-transparent to-transparent"/>
      <div className="relative flex w-full flex-col justify-between p-10">
        <div className="rounded-2xl bg-white/10 backdrop-blur p-4 text-white ring-1 ring-white/20 max-w-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-white/70">Why Reservo</div>
          <div className="mt-2 font-display text-xl font-bold leading-tight">Every slot is real.<br/>Every booking is instant.</div>
          <div className="mt-2 text-sm leading-6 text-white/80">No double-bookings. Providers publish availability, you pick a time, we lock it with tstzrange.</div>
          <div className="mt-4 flex items-center gap-2">
            <img src="https://i.pravatar.cc/100?img=32" alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20"/>
            <img src="https://i.pravatar.cc/100?img=33" alt="" className="h-7 w-7 -ml-2 rounded-full object-cover ring-2 ring-white/20"/>
            <span className="ml-2 text-xs font-semibold">2,400+ bookings this month</span>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-xl max-w-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">✓</div>
            <div><div className="text-sm font-bold text-slate-900">Booking confirmed</div><div className="text-xs text-slate-500">Today 14:00–16:00 · Studio A</div></div>
            <span className="ml-auto rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">Confirmed</span>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {illustrationSide==='left' ? <>{visual}{form}</> : <>{form}{visual}</>}
    </div>
  );
}
