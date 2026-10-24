import apiClient from './client';
import type { BookingUnit, Category, Service } from '../types/catalog';

export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get<Category[]>('/categories');
  return res.data;
}

export async function getServices(categoryId?: string): Promise<Service[]> {
  const res = await apiClient.get<Service[]>('/services', {
    params: categoryId ? { categoryId } : undefined,
  });
  return res.data;
}

export async function getServiceById(id: string): Promise<Service> {
  const res = await apiClient.get<Service>(`/services/${id}`);
  return res.data;
}

export async function getMyServices(): Promise<Service[]> {
  const res = await apiClient.get<Service[]>('/services/mine');
  return res.data;
}

export interface ServiceRequest {
  categoryId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  bookingUnit: BookingUnit;
  /** New cover image; when present the server replaces and deletes the old file. */
  image?: File | null;
  /** Clears the current cover without uploading a new one. */
  removeImage?: boolean;
}

function toServiceForm(data: ServiceRequest): FormData {
  const form = new FormData();
  form.append('CategoryId', data.categoryId);
  form.append('Name', data.name);
  form.append('Description', data.description ?? '');
  form.append('IsActive', String(data.isActive));
  form.append('BookingUnit', data.bookingUnit);
  form.append('RemoveImage', String(data.removeImage ?? false));
  if (data.image) form.append('Image', data.image);
  return form;
}

export async function createService(data: ServiceRequest): Promise<Service> {
  const res = await apiClient.post<Service>('/services', toServiceForm(data));
  return res.data;
}

export async function updateService(id: string, data: ServiceRequest): Promise<Service> {
  const res = await apiClient.put<Service>(`/services/${id}`, toServiceForm(data));
  return res.data;
}

export async function toggleServiceActive(id: string): Promise<Service> {
  const res = await apiClient.patch<Service>(`/services/${id}/toggle-active`);
  return res.data;
}
export interface CategoryRequest {
  name: string;
  description: string | null;
  /** New cover image; when present the server replaces and deletes the old file. */
  image?: File | null;
  /** Clears the current cover without uploading a new one. */
  removeImage?: boolean;
}

function toCategoryForm(data: CategoryRequest): FormData {
  const form = new FormData();
  form.append('Name', data.name);
  form.append('Description', data.description ?? '');
  form.append('RemoveImage', String(data.removeImage ?? false));
  if (data.image) form.append('Image', data.image);
  return form;
}

export async function createCategory(data: CategoryRequest): Promise<Category> {
  const res = await apiClient.post<Category>('/categories', toCategoryForm(data));
  return res.data;
}

export async function updateCategory(id: string, data: CategoryRequest): Promise<Category> {
  const res = await apiClient.put<Category>(`/categories/${id}`, toCategoryForm(data));
  return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}`);
}

export async function getAllCategoriesAdmin(): Promise<Category[]> {
  const res = await apiClient.get<Category[]>('/categories/all');
  return res.data;
}

export async function toggleCategoryActive(id: string): Promise<Category> {
  const res = await apiClient.patch<Category>(`/categories/${id}/toggle-active`);
  return res.data;
}