import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { LogoWordmark } from './components/ui/LogoMark';
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
import Overview from './pages/Overview';
import Settings from './pages/Settings';
import CategoryManagement from './pages/CategoryManagement';
import ProviderRevenue from './pages/ProviderRevenue';
import { useAuth } from './context/AuthContext';

function pageTitle(pathname: string) {
  if (pathname === '/') return 'Home';
  if (pathname === '/categories') return 'Explore';
  if (pathname.startsWith('/categories/')) return 'Services';
  if (pathname.startsWith('/services/')) return 'Service details';
  if (pathname.startsWith('/elements/')) return 'Booking';
  if (pathname === '/my-bookings') return 'My bookings';
  if (pathname === '/provider/dashboard') return 'My services';
  if (pathname === '/provider/services/new') return 'New service';
  if (pathname.startsWith('/provider/services/')) return 'Manage service';
  if (pathname.startsWith('/provider/elements/')) return 'Manage element';
  if (pathname === '/provider/revenue') return 'Revenue & sales';
  if (pathname === '/admin/users') return 'Manage users';
  if (pathname === '/admin/categories') return 'Manage categories';
  if (pathname === '/overview') return 'Overview';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/login') return 'Sign in';
  if (pathname === '/register') return 'Create account';
  return 'Overview';
}

function TopBar({
  onMenu,
  title,
  showSidebar,
}: {
  onMenu: () => void;
  title: string;
  showSidebar: boolean;
}) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center border-b border-[#e2e8f0] bg-white">
      <div className="flex h-full w-[240px] shrink-0 items-center justify-between border-r border-[#e2e8f0] px-5 max-lg:w-auto max-lg:border-r-0">
        <Link to="/" className="flex items-center">
          <LogoWordmark brand="Reservo Marketplace" withMark={false} />
        </Link>
        {showSidebar && (
          <button
            onClick={onMenu}
            className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-600 hover:bg-[#f1f5f9] lg:hidden"
            aria-label="Open navigation menu"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center px-6">
        <h1 className="font-serif text-[18px] sm:text-[20px] font-bold tracking-tight text-slate-900 truncate">
          {title}
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3 px-4 sm:px-6 shrink-0">
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-[#f1f5f9] hover:text-slate-900 transition-colors"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
            </svg>
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-xl ring-1 ring-black/5 z-50">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
                <span className="font-serif text-sm font-bold text-slate-900">Notifications</span>
                <button onClick={() => setNotifOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="divide-y divide-[#f1f5f9] text-xs">
                <div className="px-4 py-3 hover:bg-[#f8fafc]">
                  <div className="font-semibold text-slate-900">Key generated successfully</div>
                  <div className="text-slate-500 mt-0.5">Your sandbox API key is active and ready to test.</div>
                </div>
                <div className="px-4 py-3 hover:bg-[#f8fafc]">
                  <div className="font-semibold text-slate-900">Quota status</div>
                  <div className="text-slate-500 mt-0.5">100 / 10,000 monthly requests consumed.</div>
                </div>
              </div>
              <button onClick={() => setNotifOpen(false)} className="w-full border-t border-[#e2e8f0] bg-[#f8fafc] py-2 text-center text-xs font-semibold text-slate-600 hover:bg-[#f1f5f9] hover:text-[#0f172a] transition">Mark all as read</button>
            </div>
          )}
        </div>
        <span className="inline-flex items-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-slate-700">
          {!user ? 'Guest' : user.role === 'Customer' ? 'User' : user.role}
        </span>
      </div>
    </header>
  );
}

export default function App() {
  const location = useLocation();
  const isAuth = location.pathname === '/login' || location.pathname === '/register';
  const isHome = location.pathname === '/';
  const showSidebar = !isAuth && !isHome;
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => { if (scrollerRef.current) scrollerRef.current.scrollTop = 0; }, [location.pathname]);
  if (isAuth) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    );
  }
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f8fafc] text-slate-900 antialiased">
      <TopBar onMenu={() => setMobileOpen(true)} title={pageTitle(location.pathname)} showSidebar={showSidebar} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {showSidebar && <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />}
        <main ref={scrollerRef} className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#f8fafc]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:categoryId/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/elements/:id" element={<ElementDetail />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/provider/dashboard" element={<ProviderDashboard />} />
            <Route path="/provider/services/new" element={<CreateService />} />
            <Route path="/provider/services/:id" element={<ManageService />} />
            <Route path="/provider/elements/:id" element={<ManageElement />} />
            <Route path="/provider/revenue" element={<ProviderRevenue />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/categories" element={<CategoryManagement />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
