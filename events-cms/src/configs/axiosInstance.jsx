import axios from 'axios';
import { toast } from 'react-toastify';
import {
    API_URL,
    API_TIMEOUT,
    API_RETRY,
    ERROR_MESSAGES,
    CACHE_CONFIG,
    FEATURES
} from './env';
 
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Creates and configures an axios instance with interceptors and error handling
 */
const axiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    // withCredentials: true
});
 
/**
 * Request Interceptor
 * Handles request configuration and authentication
 */
axiosInstance.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem(CACHE_CONFIG.TOKEN_KEY);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        } catch (error) {
            return Promise.reject(error);
        }
    },
    (error) => {
        return Promise.reject(error);
    }
);
 
/**
 * Response Interceptor
 * Handles response processing and error handling
 */
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Don't handle refresh token for login requests
        if (originalRequest.url.includes('auth/admin')) {
            return Promise.reject(error);
        }

        if (!error.response) {
            if (error.message?.includes('Network Error')) {
                toast.error(ERROR_MESSAGES.NETWORK_ERROR);
            }
            return Promise.reject(error);
        }

        // Handle token expiration
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem(CACHE_CONFIG.REFRESH_TOKEN_KEY);
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
                    refreshToken: refreshToken
                });

                const { accessToken, newRefreshToken } = response.data;

                localStorage.setItem(CACHE_CONFIG.TOKEN_KEY, accessToken);
                localStorage.setItem(CACHE_CONFIG.REFRESH_TOKEN_KEY, newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Only redirect to login if it's not a login request
                if (!originalRequest.url.includes('auth/admin')) {
                    localStorage.removeItem(CACHE_CONFIG.TOKEN_KEY);
                    localStorage.removeItem(CACHE_CONFIG.REFRESH_TOKEN_KEY);
                    localStorage.removeItem('userData');
                    window.location.href = '/auth/signin';
                }
                return Promise.reject(refreshError);
            }
        }

        // Handle other error cases
        switch (error.response.status) {
            case 403:
                toast.error(ERROR_MESSAGES.FORBIDDEN);
                break;
            case 404:
                toast.error(ERROR_MESSAGES.NOT_FOUND);
                break;
            case 500:
                toast.error(ERROR_MESSAGES.SERVER_ERROR);
                break;
            default:
                const errorMessage = error.response?.data?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
                toast.error(errorMessage);
        }

        return Promise.reject(error);
    }
);
 
// Add global error handler
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.isAxiosError && !event.reason.response) {
        toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    }
});
 
export default axiosInstance;