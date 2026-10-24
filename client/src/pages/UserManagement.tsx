import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, updateUserRole, toggleUserActive } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { ListRowSkeletonGroup } from '../components/ui/ListRowSkeleton';

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

  const toggleMutation = useMutation({
    mutationFn: (id:string)=> toggleUserActive(id),
    onSuccess: ()=> queryClient.invalidateQueries({ queryKey:['allUsers'] }),
    onError: (err:any)=> setRoleError(err?.response?.data?.message ?? 'Could not toggle active.'),
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
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users?.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => mutation.mutate({ id: u.id, role: e.target.value })}
                            disabled={mutation.isPending}
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                          >
                            {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${u.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => toggleMutation.mutate(u.id)} disabled={toggleMutation.isPending} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{u.isActive ? 'Deactivate' : 'Activate'}</button>
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