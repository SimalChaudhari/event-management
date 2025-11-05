import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import {
    ENGAGEMENT_LOADING,
    ENGAGEMENT_ERROR,
    ENGAGEMENT_LIST,
    ENGAGEMENT_BY_ID,
    ENGAGEMENT_BY_TRACK,
    CREATE_ENGAGEMENT,
    UPDATE_ENGAGEMENT,
    DELETE_ENGAGEMENT,
    TOGGLE_ENGAGEMENT_STATUS,
    CLEAR_ENGAGEMENT_ERROR
} from '../constants/actionTypes';

// Set Loading State
export const setEngagementLoading = (loading) => ({
    type: ENGAGEMENT_LOADING,
    payload: loading
});

// Set Error State
export const setEngagementError = (error) => ({
    type: ENGAGEMENT_ERROR,
    payload: error
});

// Clear Error
export const clearEngagementError = () => ({
    type: CLEAR_ENGAGEMENT_ERROR
});

// Get all engagements
export const getAllEngagements = () => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        
        const response = await axiosInstance.get('/engagements');
        
        dispatch({
            type: ENGAGEMENT_LIST,
            payload: response.data.data
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch engagements';
        dispatch(setEngagementError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setEngagementLoading(false));
    }
};

// Get active engagements
export const getActiveEngagements = () => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        
        const response = await axiosInstance.get('/engagements/active');
        
        dispatch({
            type: ENGAGEMENT_LIST,
            payload: response.data.data
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch active engagements';
        dispatch(setEngagementError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setEngagementLoading(false));
    }
};

// Get engagement by ID
export const getEngagementById = (id) => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        
        const response = await axiosInstance.get(`/engagements/${id}`);
        
        dispatch({
            type: ENGAGEMENT_BY_ID,
            payload: response.data.data
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch engagement';
        dispatch(setEngagementError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setEngagementLoading(false));
    }
};

// Get engagements by track ID
export const getEngagementsByTrack = (trackId) => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        
        const response = await axiosInstance.get(`/engagements/track/${trackId}`);
        
        dispatch({
            type: ENGAGEMENT_BY_TRACK,
            payload: { trackId, engagements: response.data.data }
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch engagements by track';
        dispatch(setEngagementError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setEngagementLoading(false));
    }
};

// Create engagement
export const createEngagement = (engagementData) => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        
        const response = await axiosInstance.post('/engagements', engagementData);
        
        dispatch({
            type: CREATE_ENGAGEMENT,
            payload: response.data.data
        });
        
        toast.success(response.data.message || 'Engagement created successfully!');
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create engagement';
        dispatch(setEngagementError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setEngagementLoading(false));
    }
};

// Update engagement
export const updateEngagement = (id, engagementData) => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        
        const response = await axiosInstance.put(`/engagements/${id}`, engagementData);
        
        dispatch({
            type: UPDATE_ENGAGEMENT,
            payload: response.data.data
        });
        
        toast.success(response.data.message || 'Engagement updated successfully!');
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update engagement';
        dispatch(setEngagementError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setEngagementLoading(false));
    }
};

// Toggle engagement status
export const toggleEngagementStatus = (id) => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        
        const response = await axiosInstance.put(`/engagements/${id}/toggle-status`);
        
        dispatch({
            type: TOGGLE_ENGAGEMENT_STATUS,
            payload: response.data.data
        });
        
        toast.success(response.data.message || 'Engagement status updated successfully!');
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to toggle engagement status';
        dispatch(setEngagementError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setEngagementLoading(false));
    }
};

// Toggle engagement session status
export const toggleEngagementSessionStatus = (sessionId) => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        const response = await axiosInstance.put(`/engagements/sessions/${sessionId}/toggle-status`);
        
        toast.success(response.data.message || 'Session status updated successfully!');
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to toggle session status';
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setEngagementLoading(false));
    }
};

// Delete engagement
export const deleteEngagement = (id) => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        
        const response = await axiosInstance.delete(`/engagements/${id}`);
        
        dispatch({
            type: DELETE_ENGAGEMENT,
            payload: id
        });
        
        toast.success(response.data.message || 'Engagement deleted successfully!');
        return { success: true };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete engagement';
        dispatch(setEngagementError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setEngagementLoading(false));
    }
};

