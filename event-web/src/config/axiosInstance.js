import axios from 'axios';
import { API_URL, API_CONFIG, CACHE_CONFIG } from './env';
import { getCookie, removeCookie } from '../utils/cookies';

const envMode = (import.meta.env.VITE_API_NODE_ENV || import.meta.env.MODE || 'development').toLowerCase();
const timeout = API_CONFIG[envMode]?.TIMEOUT ?? 15000;

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor – add auth token from cookie when available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getCookie(CACHE_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser set Content-Type (with boundary) for FormData so file uploads work
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 (clear auth cookies and redirect to login)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeCookie(CACHE_CONFIG.TOKEN_KEY);
      removeCookie(CACHE_CONFIG.REFRESH_TOKEN_KEY);
      removeCookie(CACHE_CONFIG.USER_KEY);
      const isAuthRoute = /^\/(login|register|verify-email|forgot-password|reset-password)/.test(window.location.pathname);
      if (!isAuthRoute && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
