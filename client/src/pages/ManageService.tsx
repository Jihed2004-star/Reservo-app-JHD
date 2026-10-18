import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServiceById, toggleServiceActive, deleteService } from '../api/catalog';
import { createElement } from '../api/elements';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/Badge';
import { ListRowSkeletonGroup } from '../components/ui/ListRowSkeleton';
import Footer from '../components/Footer';

export default function ManageService() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [attrPairs, setAttrPairs] = useState([{ key: '', value: '' }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => getServiceById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: createElement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setName('');
      setPrice('');
      setAttrPairs([{ key: '', value: '' }]);
      setShowForm(false);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Could not create element.');
    },
  });

  const navigate = useNavigate();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => navigate('/provider/dashboard'),
    onError: (err: any) => setDeleteError(err?.response?.data?.message ?? 'Could not delete service.'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleServiceActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
    },
  });

  function updatePair(index: number, field: 'key' | 'value', value: string) {
    const next = [...attrPairs];
    next[index][field] = value;
    setAttrPairs(next);
  }

  function handleSubmit() {
    if (!id || !name || !price) {
      setFormError('Name and price are required.');
      return;
    }
    const attributes: Record<string, string> = {};
    attrPairs.forEach((p) => {
      if (p.key.trim()) attributes[p.key.trim()] = p.value;
    });

    mutation.mutate({
      serviceId: id,
      name,
      orderIndex: service?.elements.length ?? 0,
      price: parseFloat(price),
      attributes,
    });
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) {
    return (
      <div className="min-h-screen bg-[#fcfcfd]">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <p className="text-slate-500">You don't have access to this page.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcfd]">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
          <div className="mt-8">
            <ListRowSkeletonGroup count={3} />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-[#fcfcfd]">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
            <p className="font-semibold text-rose-700">Couldn't load this service</p>
            <p className="mt-1 text-sm text-rose-500">
              Something went wrong on our end — try refreshing the page.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{service.name}</h1>
              <StatusBadge isActive={service.isActive} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {service.categoryName} · {service.bookingUnit}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => toggleMutation.mutate(service.id)}
              disabled={toggleMutation.isPending}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                service.isActive
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {service.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this service permanently? This cannot be undone.')) {
                  deleteMutation.mutate(service.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>

        {deleteError && <p className="mt-4 text-sm text-amber-600">{deleteError}</p>}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Elements</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : '+ Add Element'}
          </button>
        </div>

        {showForm && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} mb-4`}
            />

            <label className={labelClass}>Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={`${inputClass} mb-4`}
            />

            <label className={labelClass}>Attributes</label>
            {attrPairs.map((pair, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input
                  type="text"
                  placeholder="key (e.g. color)"
                  value={pair.key}
                  onChange={(e) => updatePair(i, 'key', e.target.value)}
                  className={`${inputClass} w-1/2`}
                />
                <input
                  type="text"
                  placeholder="value (e.g. Red)"
                  value={pair.value}
                  onChange={(e) => updatePair(i, 'value', e.target.value)}
                  className={`${inputClass} w-1/2`}
                />
              </div>
            ))}
            <button
              onClick={() => setAttrPairs([...attrPairs, { key: '', value: '' }])}
              className="mb-5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              + Add attribute
            </button>

            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Creating...' : 'Create Element'}
            </button>

            {formError && <p className="mt-3 text-sm text-amber-600">{formError}</p>}
          </div>
        )}

        <div className="mt-6">
          {service.elements.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <p className="font-semibold text-slate-900">No elements yet</p>
              <p className="mt-1 text-sm text-slate-500">Add one above to get started.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {service.elements.map((el) => (
                <li
                  key={el.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{el.name}</p>
                    <p className="text-sm text-slate-500">${el.price}</p>
                  </div>
                  <Link
                    to={`/provider/elements/${el.id}`}
                    className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Manage availability →
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