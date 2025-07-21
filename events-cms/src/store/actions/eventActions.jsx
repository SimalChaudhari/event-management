import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { EVENT_BY_ID, EVENT_LIST, EXHIBITOR_LIST, GALLERY_LIST, PARTICIPATED_EVENTS, UPCOMING_EVENT_LIST } from '../constants/actionTypes';

export const eventList = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/events');
        dispatch({
            type: EVENT_LIST,
            payload: response.data // Assuming response contains the customers data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors
};

export const eventById = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/events/${id}`);
        dispatch({
            type: EVENT_BY_ID,
            payload: response.data
        });
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
};

export const upcomingEventList = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/events?upcoming=true');
        dispatch({
            type: UPCOMING_EVENT_LIST,
            payload: response.data // Assuming response contains the customers data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors
};

export const createEvent = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/events/create', data);
        console.log({ response });
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

export const participatedEvents = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/register-events/all');
        dispatch({
            type: PARTICIPATED_EVENTS,
            payload: response.data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors
};

export const registerEventById = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/register-events/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// All Filter Delete Events

export const eventDelete = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/events/delete/${id}`);
        return true;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};

export const registrationDelete = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/register-events/delete/${id}`);
        return true;
    } catch (error) {
        console.error('Error deleting registration:', error);
        throw error;
    }
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
        throw error;
    }
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
        const response = await axiosInstance.get('/gallery');
        dispatch({
            type: GALLERY_LIST,
            payload: response.data
        });
        return true;
    } catch (error) {
        console.error('Error fetching gallery:', error);
        throw error;
    }
};

export const exhibitorGet = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/exhibitors');
        return response.data;
    } catch (error) {
        console.error('Error fetching exhibitor:', error);
        throw error;
    }
};

export const createEventStamp = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/events/event-stamps/create-or-update', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const eventGetStamp = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/events/event-stamps');
        return response.data;
    } catch (error) {
        console.error('Error fetching event stamp:', error);
        throw error;
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
        console.error('Error removing event stamp image:', error);
        throw error;
    }
};
export const removeEventFloorPlan = (eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/floor-plan/${eventId}`);
        return response.data;
    } catch (error) {
        console.error('Error removing event floor plan:', error);
        throw error;
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
        toast.error(errorMessage || 'Error updating registration');
        throw error;
    }
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
        toast.error(errorMessage || 'Error deleting registration');
        throw error;
    }
};

