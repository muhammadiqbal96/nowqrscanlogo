import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nowqr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nowqr_token');
      localStorage.removeItem('nowqr_user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth API ─────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    first_name: string;
    last_name: string;
    business_name?: string;
    email: string;
    password: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) => api.post('/auth/reset-password', data),

  googleRedirect: () => api.get('/auth/google'),
};

// ─── Campaign API ────────────────────────────────────────────────
export const campaignApi = {
  list: (page = 1) => api.get(`/campaigns?page=${page}`),
  get: (id: number) => api.get(`/campaigns/${id}`),
  create: (data: {
    name: string;
    business_name: string;
    business_description?: string;
    target_audience?: string;
    cta_type: string;
    custom_cta?: string;
  }) => api.post('/campaigns', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/campaigns/${id}`, data),
  delete: (id: number) => api.delete(`/campaigns/${id}`),
  publish: (id: number) => api.post(`/campaigns/${id}/publish`),
  uploadAsset: (id: number, type: 'logo' | 'background', file: File) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    return api.post(`/campaigns/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── ScanLogo API ────────────────────────────────────────────────
export const scanLogoApi = {
  list: (page = 1) => api.get(`/scanlogos?page=${page}`),
  get: (id: number) => api.get(`/scanlogos/${id}`),
  create: (data: {
    campaign_id?: number;
    destination_url: string;
    shape?: string;
    animation?: string;
    color?: string;
    cta_text?: string;
    safe_scan_badge?: boolean;
  }) => api.post('/scanlogos', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/scanlogos/${id}`, data),
  delete: (id: number) => api.delete(`/scanlogos/${id}`),
  uploadLogo: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/scanlogos/${id}/upload-logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  options: () => api.get('/scanlogo-options'),
};

// ─── AI API ──────────────────────────────────────────────────────
export const aiApi = {
  generateContent: (data: {
    campaign_id?: number;
    business_name: string;
    business_description: string;
    target_audience?: string;
    cta_type: string;
    custom_cta?: string;
    tone?: string;
  }) => api.post('/ai/generate', data),
};

// ─── Analytics API ───────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  campaign: (id: number) => api.get(`/analytics/campaigns/${id}`),
  scanLogo: (id: number) => api.get(`/analytics/scanlogos/${id}`),
};

// ─── Credits API ─────────────────────────────────────────────────
export const creditsApi = {
  balance: () => api.get('/credits/balance'),
  transactions: (page = 1) => api.get(`/credits/transactions?page=${page}`),
  purchasePlan: (plan: string, paymentId: string) =>
    api.post('/credits/purchase-plan', { plan, payment_id: paymentId }),
  topUp: (credits: number, paymentId: string) =>
    api.post('/credits/top-up', { credits, payment_id: paymentId }),
};

// ─── Profile API ─────────────────────────────────────────────────
export const profileApi = {
  update: (data: {
    first_name?: string;
    last_name?: string;
    business_name?: string;
  }) => api.put('/profile', data),
  changePassword: (data: {
    current_password?: string;
    password: string;
    password_confirmation: string;
  }) => api.put('/profile/password', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAccount: () => api.delete('/profile'),
};

// ─── Pricing API ─────────────────────────────────────────────────
export const pricingApi = {
  get: () => api.get('/pricing'),
};
