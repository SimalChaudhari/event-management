/**
 * Environment configuration (Vite: use import.meta.env.VITE_*)
 */

const getEnv = (key, fallback = '') =>
  (import.meta.env[key] ?? fallback);

export const API_TIMEOUT = Number(getEnv('VITE_API_TIMEOUT', '15000'));
export const API_RETRY = {
  attempts: Number(getEnv('VITE_API_RETRY_ATTEMPTS', '3')),
  delay: Number(getEnv('VITE_API_RETRY_DELAY', '1000')),
};

const envMode = (getEnv('VITE_API_NODE_ENV') || getEnv('MODE', 'development')).toLowerCase();

export const API_CONFIG = {
  development: {
    BASE_URL: getEnv('VITE_API_BASE_URL', 'http://localhost:5000'),
    TIMEOUT: API_TIMEOUT,
  },
  production: {
    BASE_URL: getEnv('VITE_API_BASE_URL', 'https://app.evential.sg:5000'),
    TIMEOUT: API_TIMEOUT,
  },
};

export const API_URL = API_CONFIG[envMode]?.BASE_URL || API_CONFIG.development.BASE_URL;
export const UPLOADS_URL = getEnv('VITE_UPLOADS_URL', API_URL);

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection issue. Please check your internet connection.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
};

export const CACHE_CONFIG = {
  TOKEN_KEY: 'event0_auth_token',
  REFRESH_TOKEN_KEY: 'event0_refresh_token',
  USER_KEY: 'event0_user_data',
};

export const FEATURES = {
  ENABLE_LOGGING: getEnv('VITE_ENABLE_LOGGING') === 'true' || import.meta.env.DEV,
};
