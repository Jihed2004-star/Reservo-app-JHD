import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function navLinkClass(isActive: boolean) {
  return `inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-semibold tracking-tight transition-all ${
    isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
  }`;
}
const ROLE_STYLES: Record<string,string> = {
  Admin: 'bg-rose-50 text-rose-600 ring-rose-200',
  Provider: 'bg-indigo-50 text-indigo-600 ring-indigo-200',
  Customer: 'bg-slate-100 text-slate-600 ring-slate-200',
};
interface ManageLink { to:string; label:string; desc:string; }
function ManageDropdown({ links }: { links: ManageLink[] }) {
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[]);
  function schedule(){ timer.current=setTimeout(()=>setOpen(false),180); }
  function cancel(){ if(timer.current){ clearTimeout(timer.current); timer.current=null; } }
  return (
    <div ref={ref} className="relative" onMouseEnter={()=>{cancel();setOpen(true);}} onMouseLeave={schedule}>
      <button onClick={()=>setOpen(o=>!o)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
        Manage <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition ${open?'rotate-180':''}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full w-64 pt-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/50">
            {links.map(l=>(
              <NavLink key={l.to} to={l.to} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition ${isActive?'bg-slate-900 text-white':'text-slate-700 hover:bg-slate-50'}`}>
                <span><span className="block text-[13px] font-semibold leading-none">{l.label}</span><span className="mt-1 block text-xs opacity-60">{l.desc}</span></span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function Avatar({name}:{name:string}){
  const initials=name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold tracking-wide text-white">{initials}</span>;
}
export default function Navbar(){
  const {user,logout}=useAuth();
  const nav=useNavigate();
  const [mobile,setMobile]=useState(false);
  function handleLogout(){ logout(); nav('/'); setMobile(false); }
  const manageLinks: ManageLink[]=[];
  if(user && (user.role==='Provider'||user.role==='Admin')) manageLinks.push({to:'/provider/dashboard',label:'My Services',desc:'Services & availability'});
  if(user && user.role==='Admin'){ manageLinks.push({to:'/admin/users',label:'Manage Users',desc:'Roles & permissions'}); manageLinks.push({to:'/admin/categories',label:'Manage Categories',desc:'Create & organize'}); }
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18" strokeLinecap="round"/><path d="M8 3v3M16 3v3" strokeLinecap="round"/><path d="M8.5 14l2 2 4.5-4.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span className="font-display text-[17px] font-extrabold tracking-tight text-slate-900">Reservo</span>
          <span className="hidden rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 sm:inline-flex">Marketplace</span>
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          <NavLink to="/" className={({isActive})=>navLinkClass(isActive)}>Home</NavLink>
          <NavLink to="/categories" className={({isActive})=>navLinkClass(isActive)}>Explore</NavLink>
          {user && <NavLink to="/my-bookings" className={({isActive})=>navLinkClass(isActive)}>My bookings</NavLink>}
          {manageLinks.length>0 && <ManageDropdown links={manageLinks}/>}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (<>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${ROLE_STYLES[user.role]??'bg-slate-100 text-slate-600 ring-slate-200'}`}>{user.role}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 pr-3 text-sm"><Avatar name={user.fullName}/><span className="max-w-[14ch] truncate text-[13px] font-semibold text-slate-900">{user.fullName}</span></span>
            <button onClick={handleLogout} className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">Logout</button>
          </>) : (<>
            <Link to="/login" className="rounded-full px-4 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900">Sign in</Link>
            <Link to="/register" className="rounded-full bg-slate-900 px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-slate-800">Get started</Link>
          </>)}
        </div>
        <button onClick={()=>setMobile(v=>!v)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 lg:hidden">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">{mobile ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round"/>}</svg>
        </button>
      </div>
      {mobile && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" onClick={()=>setMobile(false)} className={({isActive})=>`rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive?'bg-slate-900 text-white':'text-slate-700 hover:bg-slate-50'}`}>Home</NavLink>
            <NavLink to="/categories" onClick={()=>setMobile(false)} className={({isActive})=>`rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive?'bg-slate-900 text-white':'text-slate-700 hover:bg-slate-50'}`}>Explore</NavLink>
            {user && <NavLink to="/my-bookings" onClick={()=>setMobile(false)} className={({isActive})=>`rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive?'bg-slate-900 text-white':'text-slate-700 hover:bg-slate-50'}`}>My bookings</NavLink>}
            {manageLinks.map(l=>(<NavLink key={l.to} to={l.to} onClick={()=>setMobile(false)} className={({isActive})=>`rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive?'bg-slate-900 text-white':'text-slate-700 hover:bg-slate-50'}`}>{l.label}</NavLink>))}
            <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
              {user ? (<><Avatar name={user.fullName}/><span className="text-sm font-semibold text-slate-900">{user.fullName}</span><button onClick={handleLogout} className="ml-auto rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white">Logout</button></>) : (<><Link to="/login" onClick={()=>setMobile(false)} className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700">Sign in</Link><Link to="/register" onClick={()=>setMobile(false)} className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white">Get started</Link></>)}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
