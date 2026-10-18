import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { LogoMark } from './ui/LogoMark';

function navLinkClass(isActive: boolean) {
  return `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-50 text-indigo-600'
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
  }`;
}

const ROLE_STYLES: Record<string, string> = {
  Admin: 'bg-rose-50 text-rose-600',
  Provider: 'bg-indigo-50 text-indigo-600',
  Customer: 'bg-slate-100 text-slate-600',
};

interface ManageLink {
  to: string;
  label: string;
}

function ManageDropdown({ links }: { links: ManageLink[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  }

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
      >
        Manage
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full w-48 pt-1">
          <div className="rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggle } = useSidebar();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const manageLinks: ManageLink[] = [];
  if (user && (user.role === 'Provider' || user.role === 'Admin')) {
    manageLinks.push({ to: '/provider/dashboard', label: 'My Services' });
  }
  if (user && user.role === 'Admin') {
    manageLinks.push({ to: '/admin/users', label: 'Manage Users' });
    manageLinks.push({ to: '/admin/categories', label: 'Manage Categories' });
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {user && (
            <button
              type="button"
              onClick={toggle}
              title="Toggle sidebar"
              className="p-2 rounded-xl text-[#5C6BC0] hover:bg-[#E8EAF6] hover:text-[#3949AB] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <Link
            to="/"
            className="flex items-center gap-2 text-base font-bold text-slate-900 transition-colors hover:text-indigo-600"
          >
            <LogoMark className="h-8 w-8 object-contain" />
            Reservo
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)}>
            Home
          </NavLink>
          <NavLink to="/Categories" className={({ isActive }) => navLinkClass(isActive)}>
            Categories
          </NavLink>

          {user && (
            <NavLink to="/my-bookings" className={({ isActive }) => navLinkClass(isActive)}>
              My Bookings
            </NavLink>
          )}

          {manageLinks.length > 0 && <ManageDropdown links={manageLinks} />}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-slate-500">
                Hi, <span className="font-medium text-slate-900">{user.fullName}</span>
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  ROLE_STYLES[user.role] ?? 'bg-slate-100 text-slate-600'
                }`}
              >
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-1.5 font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}