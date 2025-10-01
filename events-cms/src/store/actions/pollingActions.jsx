import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import {
    POLLING_LOADING,
    POLLING_ERROR,
    POLLING_LIST,
    POLL_BY_ID,
    CREATE_POLL,
    UPDATE_POLL,
    DELETE_POLL,
    TOGGLE_POLL_LIVE,
    POLL_RESULTS,
    POLL_VOTES,
    CLEAR_POLLING_ERROR
} from '../constants/actionTypes';

// Helper function to dispatch loading state
const setLoading = (dispatch, loading) => {
    dispatch({
        type: POLLING_LOADING,
        payload: loading
    });
};

// Get all polls for admin (no filters required)
export const getAllPollsForAdmin = () => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.get('/events/polls/admin/all');

        dispatch({
            type: POLLING_LIST,
            payload: response.data
        });

        setLoading(dispatch, false);
        return response.data;
    } catch (error) {
        console.error('Error fetching polls:', error);
        dispatch({
            type: POLLING_ERROR,
            payload: error.response?.data?.message || 'Failed to fetch polls'
        });
        setLoading(dispatch, false);
        toast.error(error.response?.data?.message || 'Failed to fetch polls');
        throw error;
    }
};

// Get all polling questions (with optional filters)
export const getAllPolls = (eventId = null, speakerId = null) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const queryParams = new URLSearchParams();
        if (eventId) queryParams.append('eventId', eventId);
        if (speakerId) queryParams.append('speakerId', speakerId);

        const response = await axiosInstance.get(`/events/polls/questions/list?${queryParams.toString()}`);

        dispatch({
            type: POLLING_LIST,
            payload: response.data
        });

        setLoading(dispatch, false);
        return response.data;
    } catch (error) {
        console.error('Error fetching polls:', error);
        dispatch({
            type: POLLING_ERROR,
            payload: error.response?.data?.message || 'Failed to fetch polls'
        });
        setLoading(dispatch, false);
        toast.error(error.response?.data?.message || 'Failed to fetch polls');
        throw error;
    }
};

// Get poll by ID
export const getPollById = (pollId) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.get(`/events/polls/${pollId}`);

        dispatch({
            type: POLL_BY_ID,
            payload: response.data.data
        });

        setLoading(dispatch, false);
        return response.data;
    } catch (error) {
        console.error('Error fetching poll:', error);
        dispatch({
            type: POLLING_ERROR,
            payload: error.response?.data?.message || 'Failed to fetch poll'
        });
        setLoading(dispatch, false);
        toast.error(error.response?.data?.message || 'Failed to fetch poll');
        throw error;
    }
};

// Create new poll
export const createPoll = (pollData) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.post('/events/polls', pollData);

        dispatch({
            type: CREATE_POLL,
            payload: response.data.data
        });

        setLoading(dispatch, false);
        toast.success(response.data.message || 'Poll created successfully');
        return response.data;
    } catch (error) {
        console.error('Error creating poll:', error);
        dispatch({
            type: POLLING_ERROR,
            payload: error.response?.data?.message || 'Failed to create poll'
        });
        setLoading(dispatch, false);
        toast.error(error.response?.data?.message || 'Failed to create poll');
        throw error;
    }
};

// Update poll
export const updatePoll = (pollId, pollData) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.put(`/events/polls/${pollId}`, pollData);

        dispatch({
            type: UPDATE_POLL,
            payload: response.data.data
        });

        setLoading(dispatch, false);
        toast.success(response.data.message || 'Poll updated successfully');
        return response.data;
    } catch (error) {
        console.error('Error updating poll:', error);
        dispatch({
            type: POLLING_ERROR,
            payload: error.response?.data?.message || 'Failed to update poll'
        });
        setLoading(dispatch, false);
        toast.error(error.response?.data?.message || 'Failed to update poll');
        throw error;
    }
};

// Delete poll
export const deletePoll = (pollId) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.delete(`/events/polls/${pollId}`);

        dispatch({
            type: DELETE_POLL,
            payload: pollId
        });

        setLoading(dispatch, false);
        toast.success(response.data.message || 'Poll deleted successfully');
        return response.data;
    } catch (error) {
        console.error('Error deleting poll:', error);
        dispatch({
            type: POLLING_ERROR,
            payload: error.response?.data?.message || 'Failed to delete poll'
        });
        setLoading(dispatch, false);
        toast.error(error.response?.data?.message || 'Failed to delete poll');
        throw error;
    }
};

// Toggle poll live status
export const togglePollLive = (pollId) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/events/polls/${pollId}/toggle-live`);

        dispatch({
            type: TOGGLE_POLL_LIVE,
            payload: response.data.data
        });

        toast.success(response.data.message || 'Poll status updated');
        return response.data;
    } catch (error) {
        console.error('Error toggling poll status:', error);
        dispatch({
            type: POLLING_ERROR,
            payload: error.response?.data?.message || 'Failed to toggle poll status'
        });
        toast.error(error.response?.data?.message || 'Failed to toggle poll status');
        throw error;
    }
};

// Get poll results/votes by event ID
export const getPollResults = (eventId) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.get(`/events/polls/votes/${eventId}`);

        dispatch({
            type: POLL_RESULTS,
            payload: response.data.data
        });

        setLoading(dispatch, false);
        return response.data;
    } catch (error) {
        console.error('Error fetching poll results:', error);
        dispatch({
            type: POLLING_ERROR,
            payload: error.response?.data?.message || 'Failed to fetch poll results'
        });
        setLoading(dispatch, false);
        toast.error(error.response?.data?.message || 'Failed to fetch poll results');
        throw error;
    }
};

// Clear polling error
export const clearPollingError = () => (dispatch) => {
    dispatch({
        type: CLEAR_POLLING_ERROR
    });
};

