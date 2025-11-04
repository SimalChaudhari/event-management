import axios from 'axios';
import { API_URL } from './env';

/**
 * Public Axios Instance for unauthenticated API calls
 * Used for Q&A share links and other public endpoints
 * No authentication token required
 */
const publicAxiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

export default publicAxiosInstance;

