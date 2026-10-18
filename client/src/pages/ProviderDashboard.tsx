import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyServices } from '../api/catalog';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { ListRowSkeletonGroup } from '../components/ui/ListRowSkeleton';
import Footer from '../components/Footer';

export default function ProviderDashboard() {
  const { user } = useAuth();

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['myServices'],
    queryFn: getMyServices,
    enabled: !!user && (user.role === 'Provider' || user.role === 'Admin'),
  });

  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) {
    return (
      <div className="min-h-screen bg-[#fcfcfd]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="text-slate-500">You don't have access to this page.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">My Services</h1>
          <Link
            to="/provider/services/new"
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            + New Service
          </Link>
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
            <ul className="space-y-4">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{service.name}</p>
                      <p className="text-sm text-slate-500">{service.categoryName}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="completed">
                          {service.elements.length}{' '}
                          {service.elements.length === 1 ? 'element' : 'elements'}
                        </Badge>
                        <Badge variant="completed">{service.bookingUnit}</Badge>
                      </div>
                    </div>

                    <StatusBadge isActive={service.isActive} />
                  </div>

                  <Link
                    to={`/provider/services/${service.id}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Manage
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}