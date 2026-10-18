import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">You are not logged in</h2>
        <p className="mt-2 text-sm text-slate-500">Please log in to view your profile and account settings.</p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const roleLabel =
    user.role === 'Admin'
      ? 'Administrator'
      : user.role === 'Provider'
      ? 'Service Provider'
      : 'Customer';

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#3949AB] to-[#5C6BC0] text-2xl font-bold text-white shadow-md">
              {initials}
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
                <span className="rounded-full bg-[#E8EAF6] px-3 py-1 text-xs font-semibold text-[#3949AB]">
                  {roleLabel}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Account Information</h2>
          <p className="mt-1 text-sm text-slate-500">
            View your registered credentials and platform role.
          </p>

          <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100 text-sm">
            <div className="py-4 flex justify-between">
              <span className="text-slate-500">Full Name</span>
              <span className="font-medium text-slate-900">{user.fullName}</span>
            </div>
            <div className="py-4 flex justify-between">
              <span className="text-slate-500">Email Address</span>
              <span className="font-medium text-slate-900">{user.email}</span>
            </div>
            <div className="py-4 flex justify-between">
              <span className="text-slate-500">Current Role</span>
              <span className="font-medium text-slate-900">{roleLabel}</span>
            </div>
            <div className="py-4 flex justify-between">
              <span className="text-slate-500">Account Status</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
              </span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4 justify-between items-center">
            <p className="text-xs text-slate-400">
              Profile editing and password changes will be available in future updates.
            </p>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
            >
              Sign out of account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
