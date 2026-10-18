import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './ui/LogoMark';

const ROLE_STYLES: Record<string,string> = {
  Admin: 'bg-rose-50 text-rose-600 ring-rose-200',
  Provider: 'bg-indigo-50 text-indigo-600 ring-indigo-200',
  Customer: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function Avatar({ name }: { name: string }){
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  return <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold tracking-wide text-white shrink-0">{initials}</span>;
}

function NavItem({ to, icon, label, desc, onClick }: { to:string; icon:React.ReactNode; label:string; desc?:string; onClick?:()=>void }){
  return (
    <NavLink to={to} onClick={onClick}
      className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive?'bg-slate-900 text-white shadow-sm':'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}` }>
      <span className="shrink-0 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span className="min-w-0"><span className="block text-[13px] font-semibold leading-none">{label}</span>{desc && <span className="mt-0.5 block text-xs opacity-60 leading-none">{desc}</span>}</span>
    </NavLink>
  );
}

function SidebarInner({ isMobile, onClose }: { isMobile:boolean; onClose:()=>void }){
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout(){ logout(); onClose(); navigate('/'); }
  const manage:{to:string;label:string;desc:string;icon:React.ReactNode}[]=[];
  if(user && (user.role==='Provider' || user.role==='Admin')) manage.push({to:'/provider/dashboard',label:'My Services',desc:'Services & availability',icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round"/></svg>});
  if(user && user.role==='Admin') manage.push(
    {to:'/admin/users',label:'Manage Users',desc:'Roles & accounts',icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-3M19 8v6" strokeLinecap="round"/></svg>},
    {to:'/admin/categories',label:'Manage Categories',desc:'Create & edit',icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>}
  );
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-4">
        <Link to="/" onClick={isMobile?onClose:undefined} className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <span className="leading-none"><span className="font-display text-[16px] font-extrabold tracking-tight text-slate-900">Reservo</span><span className="ml-2 hidden rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white sm:inline">MARKETPLACE</span></span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          <div>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Discover</div>
            <div className="space-y-1">
              <NavItem to="/" onClick={isMobile?onClose:undefined} label="Home" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" strokeLinejoin="round"/></svg>} />
              <NavItem to="/categories" onClick={isMobile?onClose:undefined} label="Explore" desc="Categories & services" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="6"/><path d="M16.5 16.5L21 21" strokeLinecap="round"/><path d="M8 11h6M11 8v6" strokeLinecap="round"/></svg>} />
              {user && <NavItem to="/my-bookings" onClick={isMobile?onClose:undefined} label="My bookings" desc="History & upcoming" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/><path d="M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>} />}
            </div>
          </div>
          {manage.length>0 && <div><div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Manage</div><div className="space-y-1">{manage.map(l=> <NavItem key={l.to} to={l.to} label={l.label} desc={l.desc} icon={l.icon} onClick={isMobile?onClose:undefined} />)}</div></div>}
          <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-100"><div className="text-xs font-bold uppercase tracking-widest text-indigo-600">Pro tip</div><p className="mt-1 text-sm leading-5 text-slate-700">Every slot you see is live — book instantly, no double bookings.</p><Link to="/categories" onClick={isMobile?onClose:undefined} className="mt-3 inline-flex rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black">Browse services →</Link></div>
        </div>
      </div>
      <div className="border-t border-slate-100 p-3">
        {user ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
            <Avatar name={user.fullName} />
            <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold leading-none text-slate-900">{user.fullName}</div><div className="mt-1 flex items-center gap-1.5"><span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ${ROLE_STYLES[user.role]??'bg-slate-100 text-slate-600 ring-slate-200'}`}>{user.role}</span><span className="truncate text-xs text-slate-500">{user.email}</span></div></div><button onClick={handleLogout} className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-slate-900" title="Logout"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link to="/login" onClick={isMobile?onClose:undefined} className="flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sign in</Link><Link to="/register" onClick={isMobile?onClose:undefined} className="flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black">Get started</Link><p className="pt-1 text-center text-xs text-slate-400">No credit card required</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose, scrollY=0 }: { open:boolean; onClose:()=>void; scrollY?: number }){
  const isCompact = scrollY > 8;
  const top = isCompact ? 48 : 56;
  return (
    <>
      <aside style={{ top, height: `calc(100vh - ${top}px)` }} className="hidden w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex lg:sticky lg:overflow-hidden transition-all duration-200"><SidebarInner isMobile={false} onClose={onClose} /></aside>
      {open && <div className="fixed inset-0 z-50 flex lg:hidden"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} /><aside className="relative flex w-[300px] max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-2xl"><SidebarInner isMobile={true} onClose={onClose} /></aside></div>}
    </>
  );
}
