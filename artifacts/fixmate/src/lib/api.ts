export type ApiUser = { id: string; displayName: string; email?: string | null; phone?: string | null; role: 'customer' | 'technician' | 'admin'; status: 'active' | 'suspended' | 'pending'; createdAt: string };
export type ApiCategory = { id: string; slug: string; nameAr: string; nameEn: string; descriptionAr: string; descriptionEn: string; icon: string; sortOrder: number; isEnabled: boolean };
export type ApiRequest = { id: string; referenceCode: string; customerId: string; categoryId: string; assignedTechnicianId?: string | null; title: string; description: string; state: string; city: string; address?: string | null; preferredDate?: string | null; status: string; createdAt: string; updatedAt: string };
export type RequestHistory = { id: string; requestId: string; fromStatus?: string | null; toStatus: string; actorId?: string | null; note?: string | null; createdAt: string };
export type ApiNotification = { id: string; userId: string; type: string; titleAr: string; bodyAr: string; referenceId?: string | null; readAt?: string | null; createdAt: string };
export type RegisterInput = { displayName: string; email?: string; phone?: string; password: string; role: 'customer' | 'technician'; state?: string; city?: string; bio?: string; location?: string; yearsExperience?: number };
export type ApiError = { error?: { code?: string; message?: string; details?: unknown } };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  const raw = await response.text();
  const body = raw ? JSON.parse(raw) : null;
  if (!response.ok) { const message = (body as ApiError)?.error?.message || 'تعذر تنفيذ العملية'; const error = new Error(message) as Error & { status?: number; code?: string }; error.status = response.status; error.code = (body as ApiError)?.error?.code; throw error; }
  return body as T;
}
export const api = {
  currentUser: () => request<{ user: ApiUser }>('/auth/me'),
  register: (input: RegisterInput) => request<{ user: ApiUser }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (identity: string, password: string) => request<{ user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ identity, password }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  categories: () => request<{ categories: ApiCategory[] }>('/categories'),
  requests: () => request<{ requests: ApiRequest[] }>('/requests'),
  createRequest: (input: { title: string; description: string; categoryId: string; state: string; city: string; address?: string; preferredDate?: string }) => request<{ request: ApiRequest }>('/requests', { method: 'POST', body: JSON.stringify(input) }),
  requestDetails: (id: string) => request<{ request: ApiRequest; history: RequestHistory[] }>(`/requests/${id}`),
  updateStatus: (id: string, status: string, note?: string) => request<{ request: ApiRequest }>(`/requests/${id}/status`, { method: 'POST', body: JSON.stringify({ status, note }) }),
  assign: (id: string, technicianId: string) => request<{ request: ApiRequest }>(`/requests/${id}/assign`, { method: 'POST', body: JSON.stringify({ technicianId }) }),
  adminTechnicians: () => request<{ technicians: Array<{ user: ApiUser; profile: { approval: string; bio: string; location: string; yearsExperience: number } }> }>('/admin/technicians'),
  approveTechnician: (id: string, approval: 'approved' | 'rejected' | 'suspended', notes?: string) => request(`/admin/technicians/${id}/approval`, { method: 'POST', body: JSON.stringify({ approval, notes }) }),
  adminCategories: () => request<{ categories: ApiCategory[] }>('/admin/categories'),
  toggleCategory: (id: string, enabled: boolean) => request(`/admin/categories/${id}/toggle`, { method: 'POST', body: JSON.stringify({ enabled }) }),
  notifications: () => request<{ notifications: ApiNotification[] }>('/notifications'),
  markNotificationRead: (id: string) => request<{ notification: ApiNotification }>(`/notifications/${id}/read`, { method: 'POST' }),
  uploadAttachment: async (requestId: string, file: File) => { const form = new FormData(); form.append('file', file); const response = await fetch(`/api/requests/${requestId}/attachments`, { method: 'POST', credentials: 'include', body: form }); const body = await response.json(); if (!response.ok) throw new Error(body?.error?.message || 'تعذر رفع المرفق'); return body as { attachment: { id: string; originalName: string } }; },
};
