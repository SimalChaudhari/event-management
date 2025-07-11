import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { SPEAKER_LIST, CREATE_SPEAKER, UPDATE_SPEAKER, DELETE_SPEAKER } from "../constants/actionTypes";

// Get all speakers
export const speakerList = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/speakers/get');
        dispatch({
            type: SPEAKER_LIST,
            payload: response.data.data,
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch speakers';
        toast.error(errorMessage);
    }
    return false;
};

// Create new speaker
export const createSpeaker = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/speakers/create', data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Speaker created successfully!');
            // Refresh the speaker list
            await dispatch(speakerList());
            return true;
        }
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create speaker';
        toast.error(errorMessage);
    }
    return false;
};

// Update speaker
export const updateSpeaker = (id, data) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/speakers/update/${id}`, data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Speaker updated successfully!');
            // Refresh the speaker list
            await dispatch(speakerList());
            return true;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update speaker';
        toast.error(errorMessage);
    }
    return false;
};

// Delete speaker
export const deleteSpeaker = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/speakers/delete/${id}`);
        toast.success('Speaker deleted successfully!');
        // Refresh the speaker list
        await dispatch(speakerList());
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete speaker';
        toast.error(errorMessage);
        throw error;
    }
};