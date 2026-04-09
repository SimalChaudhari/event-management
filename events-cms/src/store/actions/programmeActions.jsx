import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import {
    PROGRAMME_LOADING,
    PROGRAMME_ERROR,
    PROGRAMME_TRACKS_LIST,
    PROGRAMME_SESSIONS_LIST,
    PROGRAMME_TRACK_SESSIONS_LIST,
    CREATE_PROGRAMME_TRACK,
    UPDATE_PROGRAMME_TRACK,
    DELETE_PROGRAMME_TRACK,
    CREATE_PROGRAMME_SESSION,
    UPDATE_PROGRAMME_SESSION,
    DELETE_PROGRAMME_SESSION,
    CLEAR_PROGRAMME_ERROR
} from '../constants/actionTypes';

// Set Loading State
export const setProgrammeLoading = (loading) => ({
    type: PROGRAMME_LOADING,
    payload: loading
});

// Set Error State
export const setProgrammeError = (error) => ({
    type: PROGRAMME_ERROR,
    payload: error
});

// Clear Error
export const clearProgrammeError = () => ({
    type: CLEAR_PROGRAMME_ERROR
});

// Get all tracks for an event (uses event-based endpoint)
export const getTracksByEvent = (eventId) => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        // Use event-based endpoint
        const response = await axiosInstance.get(`/events/${eventId}/programme/tracks`);
        
        dispatch({
            type: PROGRAMME_TRACKS_LIST,
            payload: response.data.data
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch programme tracks';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Get all tracks (no event filter)
export const getAllTracks = () => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        const response = await axiosInstance.get('/programme/tracks');
        
        dispatch({
            type: PROGRAMME_TRACKS_LIST,
            payload: response.data.data
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch all programme tracks';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Get all sessions for a track (uses event-based endpoint when eventId is provided)
export const getSessionsByTrack = (trackId, eventId = null) => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        // Use event-based endpoint if eventId is provided
        const url = eventId 
            ? `/events/${eventId}/programme/tracks/${trackId}/sessions`
            : `/programme/tracks/${trackId}/sessions`;
        
        const response = await axiosInstance.get(url);
        
        dispatch({
            type: PROGRAMME_TRACK_SESSIONS_LIST,
            payload: { trackId, sessions: response.data.data }
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch programme sessions';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Get all sessions for an event
export const getSessionsByEvent = (eventId) => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        const response = await axiosInstance.get(`/programme/events/${eventId}/sessions`);
        
        dispatch({
            type: PROGRAMME_SESSIONS_LIST,
            payload: response.data.data
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch programme sessions';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Get all sessions (no event filter)
export const getAllSessions = () => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        const response = await axiosInstance.get('/programme/sessions');
        
        dispatch({
            type: PROGRAMME_SESSIONS_LIST,
            payload: response.data.data
        });
        
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch all programme sessions';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Create track (uses event-based endpoint when eventId is provided)
export const createTrack = (eventId, trackData) => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        // Use event-based endpoint
        const response = await axiosInstance.post(`/events/${eventId}/programme/tracks`, trackData);
        
        dispatch({
            type: CREATE_PROGRAMME_TRACK,
            payload: response.data.data
        });
        
        toast.success(response.data.message);
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create track';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Update track (uses event-based endpoint when eventId is provided)
export const updateTrack = (trackId, trackData, eventId = null) => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        // Use event-based endpoint if eventId is provided
        const url = eventId 
            ? `/events/${eventId}/programme/tracks/${trackId}`
            : `/programme/tracks/${trackId}`;
        
        const response = await axiosInstance.put(url, trackData);
        
        dispatch({
            type: UPDATE_PROGRAMME_TRACK,
            payload: response.data.data
        });
        
        toast.success(response.data.message);
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update track';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Delete track (uses event-based endpoint when eventId is provided)
export const deleteTrack = (trackId, eventId = null) => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        // Use event-based endpoint if eventId is provided
        const url = eventId 
            ? `/events/${eventId}/programme/tracks/${trackId}`
            : `/programme/tracks/${trackId}`;
        
        const response = await axiosInstance.delete(url);
        
        dispatch({
            type: DELETE_PROGRAMME_TRACK,
            payload: trackId
        });
        
        toast.success(response.data.message || 'Track deleted successfully!');
        return { success: true };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete track';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Create session (uses event-based endpoint when eventId is provided)
export const createSession = (sessionData, eventId = null) => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        // Use event-based endpoint if eventId is provided
        const url = eventId 
            ? `/events/${eventId}/programme/sessions`
            : '/programme/sessions';
        
        const response = await axiosInstance.post(url, sessionData);
        
        dispatch({
            type: CREATE_PROGRAMME_SESSION,
            payload: response.data.data
        });
        
        toast.success(response.data.message || 'Session created successfully!');
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create session';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Update session (uses event-based endpoint when eventId is provided)
export const updateSession = (sessionId, sessionData, eventId = null) => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        // Use event-based endpoint if eventId is provided
        const url = eventId 
            ? `/events/${eventId}/programme/sessions/${sessionId}`
            : `/programme/sessions/${sessionId}`;
        
        const response = await axiosInstance.put(url, sessionData);
        
        dispatch({
            type: UPDATE_PROGRAMME_SESSION,
            payload: response.data.data
        });
        
        toast.success(response.data.message || 'Session updated successfully!');
        return { success: true, data: response.data.data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update session';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Delete session (uses event-based endpoint when eventId is provided)
export const deleteSession = (sessionId, eventId = null) => async (dispatch) => {
    try {
        dispatch(setProgrammeLoading(true));
        
        // Use event-based endpoint if eventId is provided
        const url = eventId 
            ? `/events/${eventId}/programme/sessions/${sessionId}`
            : `/programme/sessions/${sessionId}`;
        
        const response = await axiosInstance.delete(url);
        
        dispatch({
            type: DELETE_PROGRAMME_SESSION,
            payload: sessionId
        });
        
        toast.success(response.data.message || 'Session deleted successfully!');
        return { success: true };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete session';
        dispatch(setProgrammeError(errorMessage));
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    } finally {
        dispatch(setProgrammeLoading(false));
    }
};

// Reorder programme tracks
export const reorderProgrammeTracks = (items) => async () => {
    try {
        const response = await axiosInstance.put('/programme/tracks/reorder', { items });
        toast.success(response.data.message || 'Programme track order updated successfully!');
        return { success: true };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update programme track order';
        toast.error(errorMessage);
        return { error: true, message: errorMessage };
    }
};

