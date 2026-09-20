import axios from 'axios';

// Resolve API base URL dynamically from localStorage override, VITE_API_URL, or relative /api
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('servora_api_url');
    if (customUrl) return `${customUrl.replace(/\/$/, '')}/api`;
  }

  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`;
  }

  // Automatic production fallback for Vercel deployments when env var is not explicitly provided
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://servora-1-o7dc.onrender.com/api';
  }

  return '/api';
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to resolve public/uploaded asset URLs across separate client and server domains
export const getAssetUrl = (assetPath?: string): string => {
  if (!assetPath) return '';
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) return assetPath;
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('servora_api_url') : null;
  const fallback = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://servora-1-o7dc.onrender.com'
    : '';
  const serverBase = customUrl || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : fallback);
  return `${serverBase}${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
};

// Attach JWT token & dynamic baseURL to requests automatically
apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
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
    // 401 Unauthorized - Session expired vs. Invalid credentials
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthAction =
        url.includes('/auth/login') ||
        url.includes('/auth/signup') ||
        url.includes('/auth/customer-signup') ||
        url.includes('/auth/customer/signup') ||
        url.includes('/auth/reset-password');

      if (isAuthAction) {
        const msg =
          error.response?.data?.error?.message ||
          'Invalid credentials. Please verify your email and password.';
        return Promise.reject(new Error(msg));
      }

      localStorage.removeItem('copilot_token');
      localStorage.removeItem('copilot_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login?session_expired=true';
      }
      return Promise.reject(new Error('Your session has expired. Please sign in again.'));
    }

    const createCustomError = (msg: string) => {
      const err: any = new Error(msg);
      err.response = error.response;
      err.status = error.response?.status;
      err.code = error.response?.data?.error?.code;
      return err;
    };

    // 403 Forbidden - Role unauthorized
    if (error.response?.status === 403) {
      const msg = error.response?.data?.error?.message || 'Access denied: Your account role is not authorized for this action.';
      return Promise.reject(createCustomError(msg));
    }

    // 500 Internal Server Error
    if (error.response?.status >= 500) {
      const serverMsg = error.response?.data?.error?.message;
      return Promise.reject(createCustomError(serverMsg || 'The server encountered a temporary issue. Please try again shortly.'));
    }

    // Network error or backend offline / cold start
    if (!error.response) {
      return Promise.reject(
        createCustomError('Unable to reach Servora backend service. If the server was idle, it may be waking up. Please retry in 15 seconds.')
      );
    }

    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected communication error occurred.';
    return Promise.reject(createCustomError(message));
  }
);
