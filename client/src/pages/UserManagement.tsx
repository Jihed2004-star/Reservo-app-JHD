import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, updateUserRole } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { ListRowSkeletonGroup } from '../components/ui/ListRowSkeleton';
import Footer from '../components/Footer';

const ROLES = ['Customer', 'Provider', 'Admin'];

export default function UserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [roleError, setRoleError] = useState<string | null>(null);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['allUsers'],
    queryFn: getAllUsers,
    enabled: user?.role === 'Admin',
  });

  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateUserRole(id, role),
    onSuccess: () => {
      setRoleError(null);
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: (err: any) => {
      setRoleError(err?.response?.data?.message ?? 'Could not update role.');
    },
  });

  if (!user || user.role !== 'Admin') {
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
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">User Management</h1>

        {roleError && <p className="mt-4 text-sm text-amber-600">{roleError}</p>}

        <div className="mt-8">
          {isLoading && <ListRowSkeletonGroup count={4} />}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
              <p className="font-semibold text-rose-700">Couldn't load users</p>
              <p className="mt-1 text-sm text-rose-500">
                Something went wrong on our end — try refreshing the page.
              </p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-3">
              {users?.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{u.fullName}</p>
                    <p className="text-sm text-slate-500">{u.email}</p>
                  </div>

                  <select
                    value={u.role}
                    onChange={(e) => mutation.mutate({ id: u.id, role: e.target.value })}
                    disabled={mutation.isPending}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}