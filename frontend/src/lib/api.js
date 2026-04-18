import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('npm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('npm_token');
      localStorage.removeItem('npm_user');
      localStorage.removeItem('npm_role');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  studentLogin: (data) => api.post('/auth/student/login', data),
  verifyOTP: (data) => api.post('/auth/student/verify-otp', data),
  resendOTP: (data) => api.post('/auth/student/resend-otp', data),
  registerStudent: (data) => api.post('/auth/student/register', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
};

// ── Student ───────────────────────────────────────────
export const studentAPI = {
  getProfile: () => api.get('/students/profile'),
  getHostels: () => api.get('/students/hostels'),
  getDashboardStats: () => api.get('/students/dashboard-stats'),
};

// ── Packages ──────────────────────────────────────────
export const packageAPI = {
  getMyPackages: (params) => api.get('/packages/my', { params }),
  getPackageDetail: (id) => api.get(`/packages/detail/${id}`),
  // Admin
  logArrival: (data) => api.post('/packages/log', data),
  adminGetAll: (params) => api.get('/packages/admin/all', { params }),
  adminGetStats: () => api.get('/packages/admin/stats'),
  markCollected: (id, data) => api.patch(`/packages/admin/${id}/collect`, data),
};

// ── Friends ───────────────────────────────────────────
export const friendAPI = {
  search: (name) => api.get('/friends/search', { params: { name } }),
  getFriends: () => api.get('/friends/list'),
  getPendingRequests: () => api.get('/friends/requests/pending'),
  sendRequest: (data) => api.post('/friends/request', data),
  respondRequest: (id, action) => api.patch(`/friends/request/${id}`, { action }),
  removeFriend: (id) => api.delete(`/friends/${id}`),
};

// ── Pickup Auth ───────────────────────────────────────
export const pickupAPI = {
  authorize: (data) => api.post('/pickup/authorize', data),
  getAuths: (type) => api.get('/pickup/list', { params: { type } }),
  respond: (id, action) => api.patch(`/pickup/respond/${id}`, { action }),
  revoke: (id) => api.delete(`/pickup/revoke/${id}`),
};

// ── Notifications ─────────────────────────────────────
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (data) => api.patch('/notifications/mark-read', data),
};

// ── Admin ─────────────────────────────────────────────
export const adminAPI = {
  getProfile: () => api.get('/admin/profile'),
  lookupStudent: (phone) => api.get('/admin/lookup-student', { params: { phone } }),
  getPlatforms: () => api.get('/admin/platforms'),
  createPlatform: (data) => api.post('/admin/platforms', data),
};

// ── Community ─────────────────────────────────────────
export const communityAPI = {
  getFriendsPackagesToday: () => api.get('/community/friends-packages-today'),
  toggleOptIn: (opt_in) => api.post('/community/opt-in', { opt_in }),
};

export default api;
