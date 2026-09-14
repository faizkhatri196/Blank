import axios from 'axios';

// Resolve API base URL from VITE_API_URL or default to relative /api for local dev proxy
const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export const apiClient = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to resolve public/uploaded asset URLs across separate client and server domains
export const getAssetUrl = (assetPath?: string): string => {
  if (!assetPath) return '';
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) return assetPath;
  const serverBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
  return `${serverBase}${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
};

// Attach JWT token to requests automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('copilot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized error interceptor with user-friendly messages and no exposed stack traces
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized - Session expired
    if (error.response?.status === 401) {
      localStorage.removeItem('copilot_token');
      localStorage.removeItem('copilot_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session_expired=true';
      }
      return Promise.reject(new Error('Your session has expired. Please sign in again.'));
    }

    // 403 Forbidden - Role unauthorized
    if (error.response?.status === 403) {
      const msg = error.response?.data?.error?.message || 'Access denied: Your account role is not authorized for this action.';
      return Promise.reject(new Error(msg));
    }

    // 500 Internal Server Error
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('The server encountered a temporary issue. Please try again shortly.'));
    }

    // Network error or backend offline / cold start
    if (!error.response) {
      return Promise.reject(
        new Error('Unable to reach Servora backend service. If the server was idle, it may be waking up. Please retry in 15 seconds.')
      );
    }

    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected communication error occurred.';
    return Promise.reject(new Error(message));
  }
);
