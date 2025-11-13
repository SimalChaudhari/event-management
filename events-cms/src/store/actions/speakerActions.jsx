import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { SPEAKER_LIST, CREATE_SPEAKER, UPDATE_SPEAKER, DELETE_SPEAKER, SPEAKER_LOADING } from "../constants/actionTypes";

// Helper function to dispatch loading state
const setSpeakerLoading = (dispatch, loading) => {
    dispatch({
        type: SPEAKER_LOADING,
        payload: loading
    });
};

// Get all speakers
export const speakerList = () => async (dispatch) => {
    try {
        setSpeakerLoading(dispatch, true);
        const response = await axiosInstance.get('/users/speakers/get');
        dispatch({
            type: SPEAKER_LIST,
            payload: response.data.data,
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch speakers';
        toast.error(errorMessage);
    } finally {
        setSpeakerLoading(dispatch, false);
    }
    return false;
};

export const speakerById = (id) => async (dispatch) => {
    try {
        setSpeakerLoading(dispatch, true);
        const response = await axiosInstance.get(`/users/speakers/${id}`);
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch speaker details';
        toast.error(errorMessage);
        throw error;
    } finally {
        setSpeakerLoading(dispatch, false);
    }
}

// Create new speaker
export const createSpeaker = (data) => async (dispatch) => {
    try {
        setSpeakerLoading(dispatch, true);
        const response = await axiosInstance.post('/users/speakers/create', data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Speaker created successfully!');
            // Update Redux store directly with the new speaker
            const newSpeaker = response.data.data || response.data;
            dispatch({
                type: CREATE_SPEAKER,
                payload: newSpeaker
            });
            return newSpeaker;
        }
        return null;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create speaker';
        toast.error(errorMessage);
        return null;
    } finally {
        setSpeakerLoading(dispatch, false);
    }
};

// Update speaker
export const updateSpeaker = (id, data) => async (dispatch) => {
    try {
        setSpeakerLoading(dispatch, true);
        const response = await axiosInstance.put(`/users/speakers/update/${id}`, data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Speaker updated successfully!');
            // Update Redux store directly with the updated speaker
            const updatedSpeaker = response.data.data || response.data;
            // Ensure the speaker object has the id
            const speakerWithId = { ...updatedSpeaker, id: id };
            dispatch({
                type: UPDATE_SPEAKER,
                payload: speakerWithId
            });
            return speakerWithId;
        }
        return null;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update speaker';
        toast.error(errorMessage);
        return null;
    } finally {
        setSpeakerLoading(dispatch, false);
    }
};

// Delete speaker
export const deleteSpeaker = (id) => async (dispatch) => {
    try {
        setSpeakerLoading(dispatch, true);
        await axiosInstance.delete(`/users/speakers/delete/${id}`);
        toast.success('Speaker deleted successfully!');
        // Update Redux store directly by removing the speaker
        dispatch({
            type: DELETE_SPEAKER,
            payload: id
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete speaker';
        toast.error(errorMessage);
        return false;
    } finally {
        setSpeakerLoading(dispatch, false);
    }
};