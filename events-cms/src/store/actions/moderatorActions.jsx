import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import {
    MODERATOR_LOADING,
    MODERATOR_ERROR,
    MODERATOR_LIST,
    MODERATOR_BY_ID,
    CREATE_MODERATOR,
    UPDATE_MODERATOR,
    DELETE_MODERATOR,
    MODERATOR_EVENTS,
} from '../constants/actionTypes';

// Helper actions
const setLoading = (isLoading) => ({
    type: MODERATOR_LOADING,
    payload: isLoading
});

const setError = (error) => ({
    type: MODERATOR_ERROR,
    payload: error
});

// Get all moderators
export const getAllModerators = () => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        
        const response = await axiosInstance.get('/moderators');
        
        dispatch({
            type: MODERATOR_LIST,
            payload: response.data.data
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch moderators';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

// Get moderator by ID
export const getModeratorById = (id) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        
        const response = await axiosInstance.get(`/moderators/${id}`);
        
        dispatch({
            type: MODERATOR_BY_ID,
            payload: response.data.data
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch moderator';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

// Create moderator
export const createModerator = (data) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        
        const response = await axiosInstance.post('/moderators', data);
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Moderator created successfully!');
            
            dispatch({
                type: CREATE_MODERATOR,
                payload: response.data.data
            });
            
            return { success: true, data: response.data.data };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create moderator';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

// Update moderator
export const updateModerator = (id, data) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        
        const response = await axiosInstance.put(`/moderators/${id}`, data);
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Moderator updated successfully!');
            
            dispatch({
                type: UPDATE_MODERATOR,
                payload: response.data.data
            });
            
            return { success: true, data: response.data.data };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update moderator';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

// Delete moderator
export const deleteModerator = (id) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        
        const response = await axiosInstance.delete(`/moderators/${id}`);
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Moderator deleted successfully!');
            
            dispatch({
                type: DELETE_MODERATOR,
                payload: id
            });
            
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete moderator';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

// Assign moderator to event
export const assignModeratorToEvent = (moderatorId, eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/moderators/assign-event', {
            moderatorId,
            eventId
        });
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Moderator assigned successfully!');
            return { success: true, data: response.data.data };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to assign moderator';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
    }
};

// Assign moderator to multiple events
export const assignModeratorToMultipleEvents = (moderatorId, eventIds) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/moderators/assign-multiple-events', {
            moderatorId,
            eventIds
        });
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Moderator assigned to events successfully!');
            return { success: true, data: response.data.data };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to assign moderator to events';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
    }
};

// Remove moderator from event
export const removeModeratorFromEvent = (moderatorId, eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/moderators/remove-event/${moderatorId}/${eventId}`);
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Moderator removed from event successfully!');
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to remove moderator from event';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
    }
};

// Get moderator events
export const getModeratorEvents = (moderatorId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/moderators/${moderatorId}/events`);
        
        dispatch({
            type: MODERATOR_EVENTS,
            payload: response.data.data
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch moderator events';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
    }
};

