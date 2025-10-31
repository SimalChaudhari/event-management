import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { EVENT_BY_ID, EVENT_LIST, EXHIBITOR_LIST, GALLERY_LIST, PARTICIPATED_EVENTS, UPCOMING_EVENT_LIST, UPDATE_EVENT_TAB_VISIBILITY, EVENT_LOADING } from '../constants/actionTypes';

// Helper function to dispatch loading state
const setEventLoading = (dispatch, loading) => {
    dispatch({
        type: EVENT_LOADING,
        payload: loading
    });
};

export const eventList = (filters = {}) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        if (filters.eventName) {
            queryParams.append('eventName', filters.eventName);
        }
        
        if (filters.keyword) {
            queryParams.append('keyword', filters.keyword);
        }
        
        if (filters.startDate) {
            queryParams.append('startDate', filters.startDate);
        }
        
        if (filters.endDate) {
            queryParams.append('endDate', filters.endDate);
        }
        
        if (filters.type) {
            queryParams.append('type', filters.type);
        }
        
        if (filters.location) {
            queryParams.append('location', filters.location);
        }
        
        if (filters.category) {
            queryParams.append('category', filters.category);
        }
        
        if (filters.globalSearch) {
            queryParams.append('globalSearch', filters.globalSearch);
        }
        
        const queryString = queryParams.toString();
        const url = queryString ? `/events?${queryString}` : '/events';
        
        const response = await axiosInstance.get(url);
        dispatch({
            type: EVENT_LIST,
            payload: response.data // Assuming response contains the customers data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
    return false; // Return false for any errors
};

export const eventById = (id) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get(`/events/${id}`);
        dispatch({
            type: EVENT_BY_ID,
            payload: response.data
        });
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
};

export const upcomingEventList = (filters = {}) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        // Build query parameters, always include upcoming=true
        const queryParams = new URLSearchParams();
        queryParams.append('upcoming', 'true');
        
        if (filters.eventName) {
            queryParams.append('eventName', filters.eventName);
        }
        
        if (filters.keyword) {
            queryParams.append('keyword', filters.keyword);
        }
        
        if (filters.startDate) {
            queryParams.append('startDate', filters.startDate);
        }
        
        if (filters.endDate) {
            queryParams.append('endDate', filters.endDate);
        }
        
        if (filters.type) {
            queryParams.append('type', filters.type);
        }
        
        if (filters.location) {
            queryParams.append('location', filters.location);
        }
        
        if (filters.category) {
            queryParams.append('category', filters.category);
        }
        
        if (filters.globalSearch) {
            queryParams.append('globalSearch', filters.globalSearch);
        }
        
        const queryString = queryParams.toString();
        const url = `/events?${queryString}`;
        
        const response = await axiosInstance.get(url);
        dispatch({
            type: UPCOMING_EVENT_LIST,
            payload: response.data // Assuming response contains the customers data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
    return false; // Return false for any errors
};

export const createEvent = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/events/create', data);
       
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Event registered successfully!');
            return true;
        }
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors
};

export const editEvent = (id, data) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/events/update/${id}`, data);

        // Check if the response is successful
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Event updated successfully!');
            return true; // Indicate successful update
        }
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors or unsuccessful attempts
};

export const participatedEvents = (filters = {}) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        if (filters.userFilter) {
            queryParams.append('user', filters.userFilter);
        }
        
        if (filters.eventFilter) {
            queryParams.append('event', filters.eventFilter);
        }
        
        if (filters.filter) {
            queryParams.append('filter', filters.filter);
        }
        
        const queryString = queryParams.toString();
        const url = queryString ? `/register-events/all?${queryString}` : '/register-events/all';
        
        const response = await axiosInstance.get(url);
        dispatch({
            type: PARTICIPATED_EVENTS,
            payload: response.data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
    return false; // Return false for any errors
};

export const registerEventById = (id) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get(`/register-events/${id}`);
        return response.data;
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
    return false; // Return false for any errors or unsuccessful attempts

};

// All Filter Delete Events

export const eventDelete = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/events/delete/${id}`);
        toast.success('Event deleted successfully!');
        return true;
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors or unsuccessful attempts
};

export const registrationDelete = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/register-events/delete/${id}`);
        return true;
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors or unsuccessful attempts
};


export const createRegisterEvent = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/register-events/admin/create', data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Register event created successfully!');
            await dispatch(participatedEvents());
            return true;
        }
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

export const removeEventImage = (eventId, imagePath) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/images/${eventId}`, {
            data: { imagePath }
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Image removed successfully!');
            // Return the updated images array from response
            return response.data.data.images;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage || 'Error removing image');
    }
    return false;
};

export const removeEventDocument = (eventId, documentPath) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/documents/${eventId}`, {
            data: { documentPath }
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Document removed successfully!');
            // Return the updated documents array from response
            return response.data.data.documents;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage || 'Error removing document');
    }
    return false;
};

export const galleryList = () => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get('/gallery');
        dispatch({
            type: GALLERY_LIST,
            payload: response.data
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
    return false;
};

export const exhibitorGet = () => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get('/exhibitors');
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
};

export const createEventStamp = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/events/event-stamps/create-or-update', data);
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
};

export const eventGetStamp = () => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get('/events/event-stamps');
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
};

export const removeEventStampImage = (eventId, imagePath) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/event-stamps/images/${eventId}`, {
            data: { imagePath }
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Image removed successfully!');
            // Return the updated images array from response
            return response.data.data.eventStampImages;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
};
export const removeEventFloorPlan = (eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/floor-plan/${eventId}`);
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
};

export const removeEventBackgroundImage = (eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/background-image/${eventId}`);
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
};

export const adminUpdateRegisterEvent = (id, data) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/register-events/admin/update/${id}`, data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Registration updated successfully!');
            // Refresh the data after update
            await dispatch(participatedEvents());
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

export const adminDeleteRegisterEvent = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/register-events/admin/delete/${id}`);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Registration deleted successfully!');
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

// Get all users for dropdown filter
export const getAllUsersForFilter = () => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get('/users');
        return response.data?.data || [];
    } catch (error) {
        console.error('Error fetching users for filter:', error);
        return [];
    } finally {
        setEventLoading(dispatch, false);
    }
};

// Get all events for dropdown filter
export const getAllEventsForFilter = () => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get('/events');
        return response.data?.events || [];
    } catch (error) {
        console.error('Error fetching events for filter:', error);
        return [];
    } finally {
        setEventLoading(dispatch, false);
    }
};

// Update event tab visibility
export const updateEventTabVisibility = (eventId, tabVisibilitySettings) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/events/${eventId}/tab-visibility`, tabVisibilitySettings);
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Tab visibility updated successfully!');
            
            // Dispatch action to update the event data in Redux store
            dispatch({
                type: UPDATE_EVENT_TAB_VISIBILITY,
                payload: {
                    eventId,
                    tabVisibility: tabVisibilitySettings
                }
            });
            
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update tab visibility';
        toast.error(errorMessage);
        return false;
    }
};

