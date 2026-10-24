import apiClient from './client';

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string|null;
  isActive: boolean;
  createdAt: string;
}

export async function getAllUsers(): Promise<UserAccount[]> {
  const res = await apiClient.get<UserAccount[]>('/users');
  return res.data;
}

export async function updateUserRole(id: string, role: string): Promise<UserAccount> {
  const res = await apiClient.patch<UserAccount>(`/users/${id}/role`, { role });
  return res.data;
}

export async function toggleUserActive(id:string): Promise<UserAccount>{
  const res = await apiClient.patch<UserAccount>(`/users/${id}/toggle-active`);
  return res.data;
}
