import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyServices } from '../api/catalog';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { ListRowSkeletonGroup } from '../components/ui/ListRowSkeleton';

export default function ProviderDashboard() {
  const { user } = useAuth();

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['myServices'],
    queryFn: getMyServices,
    enabled: !!user && (user.role === 'Provider' || user.role === 'Admin'),
  });

  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="text-slate-500">You don't have access to this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">My Services</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/provider/revenue"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Revenue
            </Link>
            <Link
              to="/provider/services/new"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              + New Service
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {isLoading && <ListRowSkeletonGroup count={3} />}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
              <p className="font-semibold text-rose-700">Couldn't load your services</p>
              <p className="mt-1 text-sm text-rose-500">
                Something went wrong on our end — try refreshing the page.
              </p>
            </div>
          )}

          {!isLoading && !error && services?.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <p className="font-semibold text-slate-900">You haven't created any services yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Start with{' '}
                <Link to="/provider/services/new" className="font-medium text-indigo-600 hover:underline">
                  + New Service
                </Link>{' '}
                above.
              </p>
            </div>
          )}

          {!isLoading && !error && services && services.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Service</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Elements</th>
                      <th className="px-4 py-3 font-semibold">Unit</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-900">{service.name}</td>
                        <td className="px-4 py-3 text-slate-600">{service.categoryName}</td>
                        <td className="px-4 py-3"><Badge variant="completed">{service.elements.length}</Badge></td>
                        <td className="px-4 py-3"><Badge variant="completed">{service.bookingUnit}</Badge></td>
                        <td className="px-4 py-3"><StatusBadge isActive={service.isActive} /></td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/provider/services/${service.id}`} className="inline-flex rounded-full bg-slate-900 px-3.5 py-1 text-xs font-semibold text-white hover:bg-black">Manage →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}