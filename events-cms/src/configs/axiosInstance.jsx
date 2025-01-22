import axios from 'axios';
import { API_URL } from './env';

const axiosInstance = axios.create({
  baseURL: API_URL, // Set the base URL for all requests
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Set the Authorization header with Bearer token
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Dynamically set Content-Type based on the request data type
      if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
      } else {
        config.headers['Content-Type'] = 'application/json';
      }

      return config; // Return the updated config
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error); // Reject the promise on error
    }
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error); // Handle request errors gracefully
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Simply return the response if no error occurs
    return response;
  },
  (error) => {
    // Log the error for debugging
    console.error('Response Interceptor Error:', error);

    // Example: Handle 401 Unauthorized globally
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access - Redirecting to login.');
      // You could redirect to login or clear user session here
      localStorage.removeItem('token'); // Clear token from localStorage
      window.location.href = '/login'; // Redirect to login page
    }

    // Reject the promise with the error object
    return Promise.reject(error);
  }
);

export default axiosInstance;
