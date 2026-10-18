import { useEffect, useRef, useState, useCallback } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Categories from './pages/Categories';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import ElementDetail from './pages/ElementDetail';
import MyBookings from './pages/MyBookings';
import ProviderDashboard from './pages/ProviderDashboard';
import CreateService from './pages/CreateService';
import ManageService from './pages/ManageService';
import ManageElement from './pages/ManageElement';
import UserManagement from './pages/UserManagement';
import CategoryManagement from './pages/CategoryManagement';
import { useAuth } from './context/AuthContext';

function pageTitle(pathname: string){
  if(pathname==='/') return 'Home';
  if(pathname==='/categories') return 'Explore';
  if(pathname.startsWith('/categories/')) return 'Services';
  if(pathname.startsWith('/services/')) return 'Service details';
  if(pathname.startsWith('/elements/')) return 'Booking';
  if(pathname==='/my-bookings') return 'My bookings';
  if(pathname==='/provider/dashboard') return 'My services';
  if(pathname==='/provider/services/new') return 'New service';
  if(pathname.startsWith('/provider/services/')) return 'Manage service';
  if(pathname.startsWith('/provider/elements/')) return 'Manage element';
  if(pathname==='/admin/users') return 'Manage users';
  if(pathname==='/admin/categories') return 'Manage categories';
  if(pathname==='/login') return 'Sign in';
  if(pathname==='/register') return 'Create account';
  return 'Reservo';
}

function TopBar({ onMenu, title, scrollY, showMenu }: { onMenu:()=>void; title:string; scrollY:number; showMenu:boolean }){
  const compact = scrollY > 8;
  const { user } = useAuth();
  const [notifOpen,setNotifOpen]=useState(false);
  const initials = user ? user.fullName.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() : '';
  return (
    <header className={`sticky top-0 z-30 flex items-center gap-3 border-b bg-white/85 backdrop-blur-xl transition-all ${compact ? 'h-[48px] border-slate-200 px-3 shadow-sm' : 'h-[56px] border-slate-200/70 px-4'}`}>
      {showMenu && (
        <button onClick={onMenu} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden" aria-label="Open menu">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/></svg>
        </button>
      )}
      <h1 className="truncate font-display text-[17px] font-bold tracking-tight text-slate-900">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button onClick={()=>setNotifOpen(v=>!v)} className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" aria-label="Notifications">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 9a6 6 0 0112 0c0 7-6 5-6 9H6s-6-2-6-9a6 6 0 016-6z" strokeLinejoin="round"/><path d="M9 21a3 3 0 006 0" strokeLinecap="round"/><path d="M10 9h4" strokeLinecap="round" opacity="0.0"/></svg>
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-sm font-semibold text-slate-900">Notifications</span>
                <button onClick={()=>setNotifOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-50"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/></svg></button>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">Booking confirmed ✓</div>
                  <div className="text-xs text-slate-500">Your slot is reserved — check My bookings.</div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">New service nearby</div>
                  <div className="text-xs text-slate-500">A provider listed a service in your category.</div>
                </div>
              </div>
              <button onClick={()=>setNotifOpen(false)} className="w-full border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold text-slate-600 hover:bg-slate-100">Mark all as read</button>
            </div>
          )}
        </div>
        {user ? (
          <Link to="/my-bookings" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{initials}</Link>
        ) : (
          <Link to="/login" className="hidden rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black sm:inline-flex">Sign in</Link>
        )}
      </div>
    </header>
  );
}

export default function App(){
  const location = useLocation();
  const isAuth = location.pathname==='/login' || location.pathname==='/register';
  const isHome = location.pathname==='/';
  const showSidebar = !isAuth && !isHome;
  const [mobileOpen,setMobileOpen]=useState(false);
  const [scrollY,setScrollY]=useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const onScroll = useCallback(()=>{ const el=scrollerRef.current; setScrollY(el?el.scrollTop:0); },[]);
  useEffect(()=>{ setMobileOpen(false); },[location.pathname]);
  useEffect(()=>{ const el=scrollerRef.current; if(!el) return; el.addEventListener('scroll', onScroll, {passive:true}); return ()=> el.removeEventListener('scroll', onScroll); },[onScroll]);
  useEffect(()=>{ if(scrollerRef.current) scrollerRef.current.scrollTop=0; setScrollY(0); },[location.pathname]);
  if(isAuth){
    return (
      <div className="min-h-screen bg-[#fcfcfd] text-slate-900 antialiased">
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
        </Routes>
      </div>
    );
  }
  return (
    <div className="flex h-screen overflow-hidden bg-[#fcfcfd] text-slate-900 antialiased">
      {showSidebar && <Sidebar open={mobileOpen} onClose={()=>setMobileOpen(false)} scrollY={scrollY} />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onMenu={()=>setMobileOpen(true)} title={pageTitle(location.pathname)} scrollY={scrollY} showMenu={showSidebar} />
        <main ref={scrollerRef} className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/categories" element={<Categories/>} />
            <Route path="/categories/:categoryId/services" element={<Services/>} />
            <Route path="/services/:id" element={<ServiceDetail/>} />
            <Route path="/elements/:id" element={<ElementDetail/>} />
            <Route path="/my-bookings" element={<MyBookings/>} />
            <Route path="/provider/dashboard" element={<ProviderDashboard/>} />
            <Route path="/provider/services/new" element={<CreateService/>} />
            <Route path="/provider/services/:id" element={<ManageService/>} />
            <Route path="/provider/elements/:id" element={<ManageElement/>} />
            <Route path="/admin/users" element={<UserManagement/>} />
            <Route path="/admin/categories" element={<CategoryManagement/>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
