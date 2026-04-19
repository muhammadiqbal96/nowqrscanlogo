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

  resendVerification: (email: string) =>
    api.post('/auth/email/verification-notification', { email }),

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
  listFlyers: (id: number) => api.get(`/campaigns/${id}/flyers`),
  storeFlyer: (id: number, data: { title?: string; image: File; canvas_state?: string }) => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    formData.append('image', data.image);
    if (data.canvas_state) formData.append('canvas_state', data.canvas_state);
    return api.post(`/campaigns/${id}/flyers`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteFlyer: (campaignId: number, flyerId: number) =>
    api.delete(`/campaigns/${campaignId}/flyers/${flyerId}`),
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
    wrapper_color?: string;
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

// ─── Template API ────────────────────────────────────────────────
export const templateApi = {
  generate: (data: {
    campaign_id: number;
    business_name: string;
    business_description: string;
    target_audience?: string;
    cta_type: string;
    category?: string;
  }) => api.post('/templates/generate', data),
  categories: () => api.get('/templates/categories'),
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
  purchasePlan: (plan: string) =>
    api.post('/credits/purchase-plan', { plan }),
  topUp: (credits: number) =>
    api.post('/credits/top-up', { credits }),
  verifySession: (sessionId: string) =>
    api.post('/credits/verify-session', { session_id: sessionId }),
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

// ─── Blog API (Public) ───────────────────────────────────────────
export const blogApi = {
  list: (page = 1, category?: string, search?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return api.get(`/blogs?${params}`);
  },
  latest: () => api.get('/blogs/latest'),
  get: (slug: string) => api.get(`/blogs/${slug}`),
};

// ─── Connected Platforms API ─────────────────────────────────────
export const platformApi = {
  list: () => api.get('/platforms'),
  get: (id: number) => api.get(`/platforms/${id}`),
  create: (data: {
    name: string;
    type: string;
    site_url: string;
    api_key?: string;
    api_secret?: string;
    username?: string;
  }) => api.post('/platforms', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/platforms/${id}`, data),
  delete: (id: number) => api.delete(`/platforms/${id}`),
  testConnection: (id: number) => api.post(`/platforms/${id}/test`),
};

// ─── Auto-Post Subscription API ──────────────────────────────────
export const autoPostSubApi = {
  list: () => api.get('/autopost/subscriptions'),
  get: (id: number) => api.get(`/autopost/subscriptions/${id}`),
  create: (data: {
    frequency: string;
    posts_per_cycle: number;
    niche?: string;
    tone?: string;
    keywords?: string[];
    custom_instructions?: string;
  }) => api.post('/autopost/subscriptions', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/autopost/subscriptions/${id}`, data),
  cancel: (id: number) => api.delete(`/autopost/subscriptions/${id}`),
  pricing: () => api.get('/autopost/pricing'),
};

// ─── Auto-Post API ──────────────────────────────────────────────
export const autoPostApi = {
  stats: () => api.get('/autopost/stats'),
  list: (page = 1, status?: string, subscriptionId?: number) => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.append('status', status);
    if (subscriptionId) params.append('subscription_id', String(subscriptionId));
    return api.get(`/autopost/posts?${params}`);
  },
  get: (id: number) => api.get(`/autopost/posts/${id}`),
  create: (data: {
    subscription_id: number;
    platform_id?: number;
    title: string;
    excerpt?: string;
    content: string;
    category?: string;
    tags?: string[];
    status?: string;
    scheduled_at?: string;
  }) => api.post('/autopost/posts', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/autopost/posts/${id}`, data),
  delete: (id: number) => api.delete(`/autopost/posts/${id}`),
  publish: (id: number) => api.post(`/autopost/posts/${id}/publish`),
};

// ─── Admin API ───────────────────────────────────────────────────
export const adminApi = {
  // Dashboard
  stats: () => api.get('/admin/stats'),

  // Users
  users: {
    list: (page = 1, search?: string, plan?: string, blocked?: string) => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.append('search', search);
      if (plan) params.append('plan', plan);
      if (blocked) params.append('blocked', blocked);
      return api.get(`/admin/users?${params}`);
    },
    get: (id: number) => api.get(`/admin/users/${id}`),
    block: (id: number) => api.post(`/admin/users/${id}/block`),
    unblock: (id: number) => api.post(`/admin/users/${id}/unblock`),
    giveCredits: (id: number, amount: number, reason: string) =>
      api.post(`/admin/users/${id}/give-credits`, { amount, reason }),
    changePlan: (id: number, plan: string) =>
      api.post(`/admin/users/${id}/change-plan`, { plan }),
    toggleAdmin: (id: number) =>
      api.post(`/admin/users/${id}/toggle-admin`),
    delete: (id: number) => api.delete(`/admin/users/${id}`),
  },

  // Blogs
  blogs: {
    list: (page = 1, search?: string, status?: string) => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      return api.get(`/admin/blogs?${params}`);
    },
    get: (id: number) => api.get(`/admin/blogs/${id}`),
    create: (data: {
      title: string;
      excerpt?: string;
      content: string;
      category?: string;
      tags?: string[];
      status?: string;
    }) => api.post('/admin/blogs', data),
    update: (id: number, data: Record<string, unknown>) =>
      api.put(`/admin/blogs/${id}`, data),
    delete: (id: number) => api.delete(`/admin/blogs/${id}`),
    uploadCover: (id: number, file: File) => {
      const formData = new FormData();
      formData.append('cover_image', file);
      return api.post(`/admin/blogs/${id}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    uploadContentImage: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return api.post('/admin/blogs/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },

  // Auto-Post management
  autoPost: {
    stats: () => api.get('/admin/autopost/stats'),
    subscriptions: (page = 1, status?: string, frequency?: string, search?: string) => {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.append('status', status);
      if (frequency) params.append('frequency', frequency);
      if (search) params.append('search', search);
      return api.get(`/admin/autopost/subscriptions?${params}`);
    },
    cancelSubscription: (id: number) =>
      api.post(`/admin/autopost/subscriptions/${id}/cancel`),
    posts: (page = 1, status?: string, search?: string) => {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      return api.get(`/admin/autopost/posts?${params}`);
    },
    getPost: (id: number) => api.get(`/admin/autopost/posts/${id}`),
    deletePost: (id: number) => api.delete(`/admin/autopost/posts/${id}`),
  },
};
