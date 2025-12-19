import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { buildUrlWithParams } from '../../utils/buildQueryParams';

/**
 * Get users with search and pagination
 * @param {Object} params - Search and pagination parameters
 * @param {string} params.search - Search term
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise} Response with user list
 */
export const filterUserList = async (params = {}) => {
    try {
        const url = buildUrlWithParams('/users', params);

        const response = await axiosInstance.get(url);

        return {
            success: true,
            data: response.data?.data || [],
            pagination: response.data?.metadata || {}
        };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch users';
        toast.error(errorMessage);
        return {
            success: false,
            data: [],
            pagination: {}
        };
    }
};

/**
 * Get events with search and pagination
 * @param {Object} params - Search and pagination parameters
 * @param {string} params.search - Search term (will be mapped to keyword)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise} Response with event list
 */
export const filterEventList = async (params = {}) => {
    try {
        // Map 'search' to 'keyword' for events API
        const eventParams = { ...params };
        if (eventParams.search) {
            eventParams.keyword = eventParams.search;
            delete eventParams.search;
        }
        
        const url = buildUrlWithParams('/events', eventParams);

        const response = await axiosInstance.get(url);
        const eventsData = response.data;

        // Filter out past events - only show current and future events
        let events = eventsData?.events || eventsData?.data || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter events where endDate >= today (current and future events only)
        events = events.filter(event => {
            if (!event.endDate) return true; // Include events without endDate
            const eventEndDate = new Date(event.endDate);
            eventEndDate.setHours(0, 0, 0, 0);
            return eventEndDate >= today; // Include if endDate is today or future
        });

        return {
            success: true,
            data: events,
            pagination: eventsData?.metadata || {}
        };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch events';
        toast.error(errorMessage);
        return {
            success: false,
            data: [],
            pagination: {}
        };
    }
};

