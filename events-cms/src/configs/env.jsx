// API Configuration


export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY = {
    attempts: 3,
    delay: 1000 // 1 second
};


// API Configuration using environment variables
export const API_CONFIG = {
    // Development
    development: {
        BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
        TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 15000,
        RETRY_ATTEMPTS: parseInt(process.env.REACT_APP_API_RETRY_ATTEMPTS) || 5,
        RETRY_DELAY: parseInt(process.env.REACT_APP_API_RETRY_DELAY) || 2000
    },
    // Production
    production: {
        BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://events.isca.org.sg:5000',
        TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 20000,
        RETRY_ATTEMPTS: parseInt(process.env.REACT_APP_API_RETRY_ATTEMPTS) || 3,
        RETRY_DELAY: parseInt(process.env.REACT_APP_API_RETRY_DELAY) || 3000
    }
};

// Current environment
const ENV = process.env.REACT_APP_API_NODE_ENV?.toLowerCase() || 'development';
export const API_URL = API_CONFIG[ENV]?.BASE_URL || API_CONFIG.development.BASE_URL;


// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: "Network connection issue. Please check your internet connection.",
    UNKNOWN_ERROR: "Something went wrong. Please try again.",
    UNAUTHORIZED: "Your session has expired. Please login again.",
    FORBIDDEN: "You don't have permission to perform this action.",
    NOT_FOUND: "The requested resource was not found.",
    SERVER_ERROR: "Server error. Please try again later."
};

// Cache Configuration
export const CACHE_CONFIG = {
    TOKEN_KEY: 'auth_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    USER_KEY: 'user_data',
    CACHE_DURATION: 24 * 60 * 60 * 1000 // 24 hours
};

// Feature Flags
export const FEATURES = {
    ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING === 'true' || process.env.NODE_ENV === 'development',
    ENABLE_CACHE: process.env.REACT_APP_ENABLE_CACHE !== 'false', // defaults to true unless explicitly set to false
    ENABLE_RETRY: process.env.REACT_APP_ENABLE_RETRY !== 'false'  // defaults to true unless explicitly set to false
};

// Dummy Data
export const DUMMY_PATH = "https://img.freepik.com/free-vector/party-invitation-design-with-crowd_23-2147737844.jpg";
export const DUMMY_PATH_USER = "https://thumbs.dreamstime.com/b/missing-data-icon-303229866.jpg";

// For Gallery Images
export const DUMMY_PATH_GALLERY = "https://thumbs.dreamstime.com/b/missing-data-icon-303229866.jpg";


// Frontend Public URL
export const BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : (process.env.REACT_APP_PUBLIC_URL || 'https://evential.org.sg');