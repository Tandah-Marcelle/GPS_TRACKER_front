import axios from 'axios';
import { notifications } from '@mantine/notifications';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string | string[]; error?: string } | undefined;
    const message = Array.isArray(data?.message) ? data?.message.join(', ') : data?.message;

    if (status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // redirect to login only if not already there
      if (window.location.pathname !== '/login') {
        notifications.show({
          title: 'Session expired',
          message: 'Please log in again',
          color: 'red',
        });
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Global notifications for server errors (component can still handle specifically)
    if (status === 403) {
      notifications.show({
        title: 'Forbidden',
        message: message || 'You do not have permission to perform this action',
        color: 'red',
      });
    } else if (status === 404) {
      notifications.show({
        title: 'Not found',
        message: message || 'Resource not found',
        color: 'red',
      });
    } else if (status === 409) {
      notifications.show({
        title: 'Conflict',
        message: message || 'Conflict error',
        color: 'orange',
      });
    } else if (status === 500) {
      notifications.show({
        title: 'Server error',
        message: message || 'Something went wrong on the server',
        color: 'red',
      });
    } else if (!error.response) {
      notifications.show({
        title: 'Network error',
        message: 'Unable to reach server. Check your connection.',
        color: 'red',
      });
    }

    return Promise.reject(error);
  },
);

export default api;
