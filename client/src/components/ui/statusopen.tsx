import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export interface StatusSidebarProps {
  onToggleCollapse?: () => void;
}

export default function Statusopen({ onToggleCollapse }: StatusSidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const roleSubtitle =
    user.role === 'Admin'
      ? 'Administrator'
      : user.role === 'Provider'
      ? 'Service Provider'
      : 'Customer';

  // Define role-specific navigation items with best-fit custom SVG icons
  const getNavItems = () => {
    const browseItem = {
      label: 'Browse (Categories)',
      to: '/categories',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
        </svg>
      ),
    };

    if (user.role === 'Admin') {
      return [
        browseItem,
        {
          label: 'Manage Categories',
          to: '/admin/categories',
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          ),
        },
        {
          label: 'Manage Users',
          to: '/admin/users',
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          label: 'All Services',
          to: '/categories',
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          ),
        },
        {
          label: 'All Bookings',
          to: '/my-bookings',
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" />
              <line x1="9" y1="11" x2="15" y2="11" />
              <line x1="9" y1="15" x2="13" y2="15" />
            </svg>
          ),
        },
      ];
    }

    if (user.role === 'Provider') {
      return [
        browseItem,
        {
          label: 'My Services',
          to: '/provider/dashboard',
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="3" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="12.01" />
              <path d="M2 12c5 2 15 2 20 0" />
            </svg>
          ),
        },
        {
          label: 'My Bookings',
          to: '/my-bookings',
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M9 16l2 2 4-4" />
            </svg>
          ),
        },
        {
          label: 'Bookings Received',
          to: '/my-bookings',
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
              <circle cx="18" cy="15" r="3" fill="#5C6BC0" stroke="white" strokeWidth="1.5" />
            </svg>
          ),
        },
      ];
    }

    // Default: Customer
    return [
      {
        label: 'Browse (Categories)',
        to: '/categories',
        icon: (active: boolean) => (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
          </svg>
        ),
      },
      {
        label: 'My Bookings',
        to: '/my-bookings',
        icon: (active: boolean) => (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M9 16l2 2 4-4" />
          </svg>
        ),
      },
    ];
  };

  const navItems = getNavItems();
  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <aside className="w-64 h-full bg-white border-r border-[#E8EAF6] flex flex-col justify-between select-none shadow-sm transition-all duration-300">
      {/* Top Section */}
      <div className="flex flex-col p-4 gap-6">
        {/* User Profile Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 relative shrink-0">
              <div className="flex justify-center items-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#3949AB] to-[#5C6BC0] text-white font-bold text-sm shadow-sm">
                {initials}
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-[#5C6BC0] border-2 border-white absolute bottom-0 right-0 shadow-sm" />
            </div>

            <div className="flex flex-col min-w-0">
              <p className="text-[#3949AB] font-inter text-sm font-semibold truncate leading-5 tracking-[-0.01em]">
                {user.fullName}
              </p>
              <p className="text-[#5C6BC0] font-inter text-xs font-medium truncate leading-4 tracking-[-0.01em]">
                {roleSubtitle}
              </p>
            </div>
          </div>

          {/* Collapse toggle button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3949AB] hover:bg-[#E8EAF6] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Quick Search */}
        <div className="flex items-center gap-2 rounded-lg bg-[#E8EAF6] px-3 py-2.5 w-full">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C6BC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="w-full bg-transparent text-sm font-medium text-[#3949AB] placeholder:text-[#5C6BC0]/80 focus:outline-none"
          />
        </div>

        {/* Dynamic Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {user.role} Navigation
          </p>

          {filteredItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-inter text-sm font-semibold tracking-[-0.01em] ${
                  isActive
                    ? 'bg-[#E8EAF6] text-[#3949AB]'
                    : 'bg-white text-slate-600 hover:bg-[#F3F4FD] hover:text-[#3949AB]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex justify-center items-center shrink-0 w-6 h-6">
                    {item.icon(isActive)}
                  </div>
                  <span className="truncate flex-1">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[#E8EAF6] flex flex-col gap-1.5">
        {/* Profile / Account Settings */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-inter text-sm font-semibold tracking-[-0.01em] ${
              isActive
                ? 'bg-[#E8EAF6] text-[#3949AB]'
                : 'bg-white text-slate-600 hover:bg-[#F3F4FD] hover:text-[#3949AB]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="flex justify-center items-center shrink-0 w-6 h-6">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  <circle cx="19" cy="19" r="2" />
                </svg>
              </div>
              <span className="truncate flex-1">Profile / Settings</span>
            </>
          )}
        </NavLink>

        {/* Logout Action */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white text-rose-600 hover:bg-rose-50 transition-colors font-inter text-sm font-semibold tracking-[-0.01em] w-full text-left"
        >
          <div className="flex justify-center items-center shrink-0 w-6 h-6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <span className="truncate">Log out</span>
        </button>
      </div>
    </aside>
  );
}