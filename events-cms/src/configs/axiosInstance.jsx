import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL, ERROR_MESSAGES, CACHE_CONFIG } from './env';
import { getCookie, setCookie, deleteCookie } from '../utils/cookieUtils';

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
        const token = getCookie(CACHE_CONFIG.TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const AUTH_ENDPOINTS = [
    '/auth/admin',
    '/auth/login', 
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh-token'
];

// Helper function to check if endpoint should skip token refresh
const shouldSkipTokenRefresh = (url) => {
    // Extract the path from the full URL
    const urlPath = url.replace(`${API_URL}/api`, '');
    const shouldSkip = AUTH_ENDPOINTS.some(endpoint => urlPath.includes(endpoint));
    
    console.log('shouldSkipTokenRefresh:', { 
        fullUrl: url, 
        urlPath, 
        shouldSkip,
        endpoints: AUTH_ENDPOINTS 
    });
    
    return shouldSkip;
};

// Simple response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip token refresh for authentication endpoints
        if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipTokenRefresh(originalRequest.url)) {
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
                const refreshToken = getCookie(CACHE_CONFIG.REFRESH_TOKEN_KEY);
                if (!refreshToken) throw new Error('No refresh token');

                const response = await axios.post(
                    `${API_URL}/api/auth/refresh-token`,
                    { refreshToken }
                );

                const { accessToken, refreshToken: newRefreshToken } = response.data;
                setCookie(CACHE_CONFIG.TOKEN_KEY, accessToken, 1);
                setCookie(CACHE_CONFIG.REFRESH_TOKEN_KEY, newRefreshToken, 30);

                processQueue(null, accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                console.log('Token refresh failed:', refreshError);
                processQueue(refreshError, null);
                deleteCookie(CACHE_CONFIG.TOKEN_KEY);
                deleteCookie(CACHE_CONFIG.REFRESH_TOKEN_KEY);
                deleteCookie(CACHE_CONFIG.USER_KEY);
                
                const shouldSkip = shouldSkipTokenRefresh(originalRequest.url);
                console.log('About to check redirect:', { 
                    url: originalRequest.url, 
                    shouldSkip,
                    willRedirect: !shouldSkip 
                });
                
                if (!shouldSkip) {
                    console.log('🚨 Token expired - Redirecting to login');
                    
                    if (window.location.pathname !== '/auth/signin') {
                        window.location.href = '/auth/signin';
                    } else {
                        console.log('Already on login page, skipping redirect');
                    }
                } else {
                    console.log('✅ Skipping redirect for auth endpoint');
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
