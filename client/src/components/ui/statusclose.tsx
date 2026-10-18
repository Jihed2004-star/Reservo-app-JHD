import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export interface StatusCloseProps {
  onToggleExpand?: () => void;
}

export default function Statusclose({ onToggleExpand }: StatusCloseProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
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

  return (
    <aside className="w-18 md:w-20 h-full bg-white border-r border-[#E8EAF6] flex flex-col items-center justify-between py-4 select-none shadow-sm transition-all duration-300">
      {/* Top Section */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* User Profile Avatar with Online dot */}
        <div className="relative">
          <div
            title={`${user.fullName} (${user.role})`}
            className="flex justify-center items-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#3949AB] to-[#5C6BC0] text-white font-bold text-sm shadow-sm cursor-pointer"
          >
            {initials}
          </div>
          <span className="w-3.5 h-3.5 rounded-full bg-[#5C6BC0] border-2 border-white absolute bottom-0 right-0 shadow-sm" />
        </div>

        {/* Expand button */}
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            title="Expand sidebar"
            className="p-2.5 rounded-xl text-slate-400 hover:text-[#3949AB] hover:bg-[#E8EAF6] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </button>
        )}

        {/* Icons-only Navigation */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `flex justify-center items-center p-3 rounded-xl transition-all ${isActive
                  ? 'bg-[#E8EAF6] text-[#3949AB] shadow-xs'
                  : 'text-[#5C6BC0] hover:bg-[#F3F4FD] hover:text-[#3949AB]'
                }`
              }
            >
              {({ isActive }) => (
                <div className="w-6 h-6 flex items-center justify-center">
                  {item.icon(isActive)}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-2 w-full px-2 border-t border-[#E8EAF6] pt-4">
        {/* Profile Settings */}
        <NavLink
          to="/profile"
          title="Profile / Settings"
          className={({ isActive }) =>
            `flex justify-center items-center p-3 rounded-xl transition-all ${isActive
              ? 'bg-[#E8EAF6] text-[#3949AB]'
              : 'text-[#5C6BC0] hover:bg-[#F3F4FD] hover:text-[#3949AB]'
            }`
          }
        >
          {({ isActive }) => (
            <div className="w-6 h-6 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#3949AB' : '#5C6BC0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                <circle cx="19" cy="19" r="2" />
              </svg>
            </div>
          )}
        </NavLink>

        {/* Logout Action */}
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          className="flex justify-center items-center p-3 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
        </button>
      </div>
    </aside>
  );
}