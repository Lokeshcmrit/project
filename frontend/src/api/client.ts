import axios from 'axios';

const BASE = 'http://localhost:4000';

const api = axios.create({ baseURL: BASE });

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('railsync_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  setDepartment: (department: string) => api.post('/auth/set-department', { department }),
};

// Requests
export const requestsAPI = {
  getAll: (params?: any) => api.get('/requests', { params }),
  getById: (id: string) => api.get(`/requests/${id}`),
  create: (formData: FormData) =>
    api.post('/requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  schedule: (id: string, data: any) => api.patch(`/requests/${id}/schedule`, data),
  reschedule: (id: string, data: any) => api.patch(`/requests/${id}/reschedule`, data),
  reject: (id: string, data: any) => api.patch(`/requests/${id}/reject`, data),
  start: (id: string) => api.patch(`/requests/${id}/start`),
  resolve: (id: string) => api.patch(`/requests/${id}/resolve`),
};

// Optimizer
export const optimizerAPI = {
  recommend: (requestId: string) => api.get(`/optimizer/recommend/${requestId}`),
  weeklySchedule: () => api.get('/optimizer/weekly-schedule'),
  monthlyHeatmap: () => api.get('/optimizer/monthly-heatmap'),
};

// Corridor
export const corridorAPI = {
  segments: () => api.get('/corridor/segments'),
  stations: () => api.get('/corridor/stations'),
  networkOverview: () => api.get('/corridor/network-overview'),
};

// Trains
export const trainsAPI = {
  getAll: () => api.get('/trains'),
  myTrain: () => api.get('/trains/my-train'),
  blockAlerts: () => api.get('/trains/block-alerts'),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Audit
export const auditAPI = {
  getLogs: () => api.get('/audit'),
};

export default api;
