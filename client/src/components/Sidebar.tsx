import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoWordmark } from './ui/LogoMark';

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1v-9.5z" strokeLinejoin="round" />
    </svg>
  ),
  playground: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8l6 4-6 4V8z" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round" />
    </svg>
  ),
  keys: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <path d="M21 2l-2 2m-1.5 1.5L14 9M3 14a7 7 0 1010-6.32L6 14.68V18h3.32l1-1v-2h2v-2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="16.5" r="1.5" />
    </svg>
  ),
  usage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  plan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 4v6M16 4v6" strokeLinecap="round" />
    </svg>
  ),
  billing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" strokeLinecap="round" />
    </svg>
  ),
  revenue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5v11" strokeLinecap="round" />
      <path d="M14.8 9.2a2.9 2.9 0 00-2.8-1.5c-1.5 0-2.6.8-2.6 1.9 0 1.2 1 1.7 2.6 2.1 1.6.4 2.8.9 2.8 2.1 0 1.2-1.2 2-2.8 2a3 3 0 01-2.8-1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  referral: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  docs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" strokeLinejoin="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 .6 1.65 1.65 0 01-2 0 1.65 1.65 0 00-1-.6 1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83-2.83l-.06-.06A1.65 1.65 0 009 15a1.65 1.65 0 00-.6-1 1.65 1.65 0 010-2c.2-.4.4-.7.6-1A1.65 1.65 0 009 9.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l-.06-.06A1.65 1.65 0 0013 4.6c.4.2.7.4 1 .6a1.65 1.65 0 012 0c.4-.2.7-.4 1-.6a1.65 1.65 0 001.82-.33l-.06-.06a2 2 0 012.83-2.83l-.06-.06A1.65 1.65 0 0019.4 9c-.2.4-.4.7-.6 1a1.65 1.65 0 010 2c.2.3.4.6.6 1z" strokeLinejoin="round" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
};

interface NavItemDef {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

function NavItem({
  to,
  icon,
  label,
  onClick,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
          isActive
            ? 'bg-[#f1f5f9] text-[#0f172a]'
            : 'text-[#334155] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`shrink-0 transition-colors ${
              isActive ? 'text-[#0f172a]' : 'text-[#475569] group-hover:text-[#0f172a]'
            }`}
          >
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarInner({
  isMobile,
  onClose,
}: {
  isMobile: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  // kept for future balance/top-up feature
  const [_balance, _setBalance] = useState(0.0);
  const [_topUpOpen, _setTopUpOpen] = useState(false);
  void _balance; void _setBalance; void _topUpOpen; void _setTopUpOpen;
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    onClose();
    navigate('/');
  }

  // Construct links based on auth role
  const navItems: NavItemDef[] = user
    ? [
        { to: '/overview', icon: ICONS.home, label: 'Overview', end: true },
        { to: '/categories', icon: ICONS.playground, label: 'Explore' },
        { to: '/my-bookings', icon: ICONS.billing, label: 'My bookings' },
        ...(user.role === 'Provider' || user.role === 'Admin'
          ? [
              { to: '/provider/dashboard', icon: ICONS.plan, label: 'My services' },
              { to: '/provider/revenue', icon: ICONS.revenue, label: 'Revenue' },
            ]
          : []),
        ...(user.role === 'Admin'
          ? [
              { to: '/admin/users', icon: ICONS.referral, label: 'Manage users' },
              { to: '/admin/categories', icon: ICONS.docs, label: 'Manage categories' },
            ]
          : []),
        { to: '/settings', icon: ICONS.settings, label: 'Settings' },
      ]
    : [
        { to: '/', icon: ICONS.home, label: 'Home', end: true },
        { to: '/categories', icon: ICONS.playground, label: 'Explore' },
      ];

  const initials = user
    ? user.fullName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Top branding inside mobile drawer or when sidebar has header */}
      {isMobile && (
        <div className="flex h-14 items-center justify-between border-b border-[#e2e8f0] px-5">
          <LogoWordmark brand="Reservo Marketplace" />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              onClick={isMobile ? onClose : undefined}
            />
          ))}

          {/* Support button */}
          <button
            onClick={() => {
              window.open('mailto:support@cleanapis.io', '_blank');
              if (isMobile) onClose();
            }}
            className="group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-[#334155] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
          >
            <span className="shrink-0 text-[#475569] transition-colors group-hover:text-[#0f172a]">
              {ICONS.support}
            </span>
            <span className="truncate">Support</span>
          </button>
        </nav>
      </div>

      {/* Bottom section: Balance Card + User Profile */}
      <div className="p-3.5">
        

        

        {/* Divider above user profile */}
        <div className="border-t border-[#e2e8f0] pt-3">
          {user ? (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex w-full items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-[#f1f5f9] text-left cursor-pointer"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4f46e5] text-xs font-bold text-white shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold leading-tight text-slate-900">
                    {user.fullName}
                  </div>
                  <div className="truncate text-xs text-slate-500 leading-tight">
                    {user.email}
                  </div>
                </div>
                <svg
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Popover Dropdown */}
              {profileOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-2 shadow-xl ring-1 ring-black/5 z-40">
                  <div className="border-b border-[#e2e8f0] px-3 py-2">
                    <div className="text-xs font-semibold text-slate-900">{user.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                    <span className="mt-1.5 inline-flex rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold text-[#0f172a]">
                      {user.role}
                    </span>
                  </div>
                  <div className="space-y-0.5 pt-1">
                    <Link
                      to="/settings"
                      onClick={() => {
                        setProfileOpen(false);
                        if (isMobile) onClose();
                      }}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#f1f5f9] hover:text-slate-900"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                state={{ from: location.pathname + location.search }}
                onClick={isMobile ? onClose : undefined}
                className="flex-1 rounded-full border border-[#e2e8f0] bg-white py-2 text-center text-xs font-semibold text-slate-800 hover:bg-[#f1f5f9] transition"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                state={{ from: location.pathname + location.search }}
                onClick={isMobile ? onClose : undefined}
                className="flex-1 rounded-full bg-[#0f172a] py-2 text-center text-xs font-semibold text-white hover:bg-[#0f172a] transition shadow-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Desktop Sidebar: pinned under TopBar */}
      <aside className="hidden w-[240px] shrink-0 border-r border-[#e2e8f0] bg-white lg:flex lg:flex-col lg:h-[calc(100vh-56px)] lg:sticky lg:top-14 overflow-hidden">
        <SidebarInner isMobile={false} onClose={onClose} />
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative flex w-[280px] max-w-[85vw] flex-col border-r border-[#e2e8f0] bg-white shadow-2xl">
            <SidebarInner isMobile={true} onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
