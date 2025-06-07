// API Configuration


export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY = {
    attempts: 3,
    delay: 1000 // 1 second
};

// API Configuration
export const API_CONFIG = {
    // Development
    development: {  // Changed from DEVELOPMENT to development
        BASE_URL: 'http://localhost:5000',
        TIMEOUT: 15000,
        RETRY_ATTEMPTS: 5,
        RETRY_DELAY: 2000
    },
    // Production
    production: {   // Changed from PRODUCTION to production
        BASE_URL: 'http://events.isca.org.sg:5000',
        TIMEOUT: 20000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 3000
    }
};

// Current environment
const ENV = process.env.NODE_ENV?.toLowerCase() || 'development';  // Added toLowerCase()
export const API_URL = API_CONFIG[ENV]?.BASE_URL || API_CONFIG.development.BASE_URL;  // Added fallback


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
    ENABLE_LOGGING: process.env.NODE_ENV === 'development',
    ENABLE_CACHE: true,
    ENABLE_RETRY: true
};

// Dummy Data
export const DUMMY_PATH = "https://img.freepik.com/free-vector/party-invitation-design-with-crowd_23-2147737844.jpg";
export const DUMMY_PATH_USER = "https://www.pngitem.com/pimgs/m/140-1403945_transparent-avatar-png-flat-hd-png-download.png";