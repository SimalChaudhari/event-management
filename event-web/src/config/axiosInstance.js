import axios from 'axios';
import { API_URL, API_CONFIG } from './env';

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

// Request interceptor – add auth token when available (e.g. from cookie/localStorage)
axiosInstance.interceptors.request.use(
  (config) => {
    // Optional: add Bearer token from CACHE_CONFIG.TOKEN_KEY when auth is implemented
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 globally when auth is added
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosInstance;
