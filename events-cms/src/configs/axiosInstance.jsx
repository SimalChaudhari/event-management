import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL, API_TIMEOUT, ERROR_MESSAGES, CACHE_CONFIG } from './env';

/**
 * Creates and configures an axios instance with interceptors and error handling
 */
const axiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
    // withCredentials: true
});


/** 
 * Request Interceptor
 * Handles request configuration and authentication
 */
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(CACHE_CONFIG.TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Handles response processing and error handling
 */
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response) {
            toast.error(ERROR_MESSAGES.NETWORK_ERROR);
            return Promise.reject(error);
        }

        // Handle token expiration
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem(CACHE_CONFIG.REFRESH_TOKEN_KEY);
                if (!refreshToken) throw new Error('No refresh token available');

                const { data: { accessToken, newRefreshToken } } = await axios.post(
                    `${API_URL}/api/auth/refresh-token`,
                    { refreshToken }
                );

                localStorage.setItem(CACHE_CONFIG.TOKEN_KEY, accessToken);
                localStorage.setItem(CACHE_CONFIG.REFRESH_TOKEN_KEY, newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                if (!originalRequest.url.includes('auth/admin')) {
                    localStorage.clear();
                    window.location.href = '/auth/signin';
                }
                return Promise.reject(refreshError);
            }
        }

        // Handle error messages
        const errorMessages = {
            403: ERROR_MESSAGES.FORBIDDEN,
            404: ERROR_MESSAGES.NOT_FOUND,
            500: ERROR_MESSAGES.SERVER_ERROR
        };

        const errorMessage = errorMessages[error.response.status] || 
            error.response?.data?.message || 
            ERROR_MESSAGES.UNKNOWN_ERROR;
            
        toast.error(errorMessage);
        return Promise.reject(error);
    }
);

// Global error handler
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.isAxiosError && !event.reason.response) {
        toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    }
});

export default axiosInstance;
