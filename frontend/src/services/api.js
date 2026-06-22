import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lexaudit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lexaudit_token');
      localStorage.removeItem('lexaudit_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Contracts
export const contractsAPI = {
  upload: (formData) =>
    api.post('/contracts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (params) => api.get('/contracts', { params }),
  getById: (id) => api.get(`/contracts/${id}`),
  delete: (id) => api.delete(`/contracts/${id}`),
  getStats: () => api.get('/contracts/stats'),
  compare: (contractAId, contractBId) =>
    api.post('/contracts/compare', { contractAId, contractBId }),
};

export default api;