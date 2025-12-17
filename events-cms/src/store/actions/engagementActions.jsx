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
import { buildUrlWithParams } from '../../utils/buildQueryParams';

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

// Get all engagements with pagination support
export const getAllEngagements = (filters = {}) => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        
        // Build URL with query parameters
        const url = buildUrlWithParams('/engagements', filters);
          const response = await axiosInstance.get(url);

        
        // Check if pagination is being used
        const hasPagination = filters.page !== undefined || filters.limit !== undefined;
        const engagementData = response.data?.data || [];
          // Dispatch payload in the same format as before (array directly) when no pagination
        // Or with data/pagination structure when pagination is used
        if (hasPagination && response.data?.metadata) {
            // New format with pagination
            dispatch({
                type: ENGAGEMENT_LIST,
                payload: {
                    data: Array.isArray(engagementData) ? engagementData : [],
                    pagination: response.data.metadata
                }
            });
        } else {
            // Previous format: dispatch array directly (backward compatibility)
            dispatch({
                type: ENGAGEMENT_LIST,
                payload: Array.isArray(engagementData) ? engagementData : []
            });
        }
        
        // Store events from response for filter dropdown
        if (response.data?.events) {
            dispatch({
                type: 'ENGAGEMENT_EVENTS_LIST',
                payload: response.data.events
            });
        }
        
        return { 
            success: true, 
            data: Array.isArray(engagementData) ? engagementData : [], 
            events: response.data?.events || [],
            pagination: response.data?.metadata || {}
        };
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

// Get engagements by track ID (with optional pagination for sessions)
export const getEngagementsByTrack = (trackId, filters = {}) => async (dispatch) => {
    try {
        dispatch(setEngagementLoading(true));
        
        // Build URL with query parameters
        const url = buildUrlWithParams(`/engagements/track/${trackId}`, filters);
        
        const response = await axiosInstance.get(url);
        
        // Check if pagination is being used (sessions mode)
        const hasPagination = filters.page !== undefined || filters.limit !== undefined;
        const responseData = response.data?.data || [];
        
        if (hasPagination && response.data?.metadata) {
            // Pagination mode: return sessions with pagination
            dispatch({
                type: 'ENGAGEMENT_SESSIONS_LIST',
                payload: {
                    data: Array.isArray(responseData) ? responseData : [],
                    pagination: response.data.metadata
                }
            });
            
            return { 
                success: true, 
                data: Array.isArray(responseData) ? responseData : [],
                pagination: response.data.metadata
            };
        } else {
            // No pagination: return engagements (backward compatibility)
            dispatch({
                type: ENGAGEMENT_BY_TRACK,
                payload: { trackId, engagements: Array.isArray(responseData) ? responseData : [] }
            });
            
            return { success: true, data: Array.isArray(responseData) ? responseData : [] };
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch engagements by track';
        dispatch(setEngagementError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setEngagementLoading(false));
    }
};

// Get engagements by event ID (optimized for form - returns simple list of trackIds)
export const getEngagementsByEvent = (eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/engagements/event/${eventId}`);
        
        // Extract trackIds from engagements for quick lookup
        const engagements = response.data.data || {};
        const programmeTracks = engagements.programmeTracks || [];
        const usedTrackIds = programmeTracks
            .filter(track => track.engagementId)
            .map(track => track.id || track.trackId);
        
        return { success: true, data: usedTrackIds, fullData: engagements };
    } catch (error) {
        // If endpoint doesn't exist or fails, return empty array (graceful degradation)
        console.warn('Failed to fetch engagements by event:', error?.response?.data?.message);
        return { success: true, data: [], fullData: null };
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

// Reorder engagements
export const reorderEngagements = (items) => async () => {
    try {
        const response = await axiosInstance.put('/engagements/reorder', { items });
        toast.success(response.data.message || 'Engagement order updated successfully!');
        return { success: true };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update engagement order';
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    }
};

