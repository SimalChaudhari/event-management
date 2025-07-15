import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL, ERROR_MESSAGES, CACHE_CONFIG } from './env';

// Simple and effective approach
const axiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    failedQueue = [];
};

// Simple request interceptor
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

// Simple response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem(CACHE_CONFIG.REFRESH_TOKEN_KEY);
                if (!refreshToken) throw new Error('No refresh token');

                const response = await axios.post(
                    `${API_URL}/api/auth/refresh-token`,
                    { refreshToken }
                );

                const { accessToken, refreshToken: newRefreshToken } = response.data;
                localStorage.setItem(CACHE_CONFIG.TOKEN_KEY, accessToken);
                localStorage.setItem(CACHE_CONFIG.REFRESH_TOKEN_KEY, newRefreshToken);

                processQueue(null, accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.clear();
                if (!originalRequest.url.includes('auth/')) {
                    window.location.href = '/auth/signin';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// Cleanup function for component unmount
export const cleanupTokenHandler = () => {
    // No state to clean up in the simple approach
};

export default axiosInstance;
