import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCategories, createService } from '../api/catalog';
import type { BookingUnit } from '../types/catalog';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

export default function CreateService() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bookingUnit, setBookingUnit] = useState<BookingUnit>('Hourly');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const mutation = useMutation({
    mutationFn: createService,
    onSuccess: (service) => {
      navigate(`/provider/services/${service.id}`);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Could not create service.');
    },
  });

  function handleSubmit() {
    if (!categoryId || !name) {
      setFormError('Category and name are required.');
      return;
    }
    setFormError(null);
    mutation.mutate({
      categoryId,
      name,
      description: description || null,
      isActive: true,
      bookingUnit,
    });
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) {
    return (
      <div className="min-h-screen bg-[#fcfcfd]">
        <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
          <p className="text-slate-500">You don't have access to this page.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">New Service</h1>

        <div className="mt-6">
          <label className={labelClass}>Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`${inputClass} mb-4`}
          >
            <option value="">Select a category</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} mb-4`}
          />

          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} mb-4`}
            rows={3}
          />

          <label className={labelClass}>Booking granularity</label>
          <select
            value={bookingUnit}
            onChange={(e) => setBookingUnit(e.target.value as BookingUnit)}
            className={`${inputClass} mb-6`}
          >
            <option value="Hourly">Hourly</option>
            <option value="Daily">Daily</option>
          </select>

          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : 'Create Service'}
          </button>

          {formError && <p className="mt-3 text-sm text-amber-600">{formError}</p>}
        </div>
      </div>

      <Footer />
    </div>
  );
}