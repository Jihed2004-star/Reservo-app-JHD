import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory, deleteCategory, getAllCategoriesAdmin, toggleCategoryActive } from '../api/catalog';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/Badge';
import { ImageUploader } from '../components/ui/ImageUploader';
import { ListRowSkeletonGroup } from '../components/ui/ListRowSkeleton';
import { categoryImage } from '../utils/images';

export default function CategoryManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['allCategoriesAdmin'],
    queryFn: getAllCategoriesAdmin,
  });

  const editingCategory = categories?.find((cat) => cat.id === editingId) ?? null;

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: resetForm,
    onError: (err: any) => setFormError(err?.response?.data?.message ?? 'Could not create category.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(id, data),
    onSuccess: resetForm,
    onError: (err: any) => setFormError(err?.response?.data?.message ?? 'Could not update category.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['allCategoriesAdmin'] });
    },
    onError: (err: any) => setDeleteError(err?.response?.data?.message ?? 'Could not delete category.'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleCategoryActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCategoriesAdmin'] });
    },
  });

  function resetForm() {
    setFormError(null);
    setName('');
    setDescription('');
    setImage(null);
    setRemoveImage(false);
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }

  function startEdit(cat: { id: string; name: string; description: string | null }) {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description ?? '');
    setImage(null);
    setRemoveImage(false);
    setFormError(null);
  }

  function handleSubmit() {
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    const data = { name, description: description || null, image, removeImage };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

  if (!user || user.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <p className="text-slate-500">You don't have access to this page.</p>
        </div>
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Category Management</h1>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? 'Edit Category' : 'New Category'}
          </h2>

          <label className={`${labelClass} mt-4`}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} mb-3`}
          />

          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} mb-4`}
            rows={2}
          />

          <ImageUploader
            label="Cover image"
            existingUrl={editingCategory?.imageUrl}
            file={image}
            onFileChange={(next) => {
              setImage(next);
              if (next) setRemoveImage(false);
            }}
            removedExisting={removeImage}
            onRemoveExistingChange={setRemoveImage}
            disabled={isPending}
          />

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            )}
          </div>

          {formError && <p className="mt-3 text-sm text-amber-600">{formError}</p>}
        </div>

        {deleteError && <p className="mt-4 text-sm text-amber-600">{deleteError}</p>}

        <div className="mt-6">
          {isLoading && <ListRowSkeletonGroup count={4} />}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
              <p className="font-semibold text-rose-700">Couldn't load categories</p>
              <p className="mt-1 text-sm text-rose-500">
                Something went wrong on our end — try refreshing the page.
              </p>
            </div>
          )}

          {!isLoading && !error && categories?.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <p className="font-semibold text-slate-900">No categories yet</p>
              <p className="mt-1 text-sm text-slate-500">Create one above to get started.</p>
            </div>
          )}

          {!isLoading && !error && categories && categories.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={categoryImage(cat)}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                            <span className="font-medium text-slate-900">{cat.name}</span>
                          </div>
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-slate-500">{cat.description ?? '—'}</td>
                        <td className="px-4 py-3"><StatusBadge isActive={cat.isActive} /></td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button onClick={() => startEdit(cat)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50">Edit</button>
                            <button onClick={() => toggleMutation.mutate(cat.id)} disabled={toggleMutation.isPending} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50">{cat.isActive ? 'Deactivate' : 'Activate'}</button>
                            <button onClick={() => deleteMutation.mutate(cat.id)} disabled={deleteMutation.isPending} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 disabled:opacity-50">Delete</button>
                          </div>
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