import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import {
    EXHIBITOR_LIST,
    EXHIBITOR_BY_ID,
    CREATE_EXHIBITOR,
    UPDATE_EXHIBITOR,
    DELETE_EXHIBITOR,
    EXHIBITOR_LOADING,
    FETCH_PROMOTIONAL_OFFERS
} from '../constants/actionTypes';

// Helper function to dispatch loading state
const setLoading = (dispatch, loading) => {
    dispatch({
        type: EXHIBITOR_LOADING,
        payload: loading
    });
};

// Get all exhibitors
export const exhibitorList = () => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.get('/exhibitors');
        dispatch({
            type: EXHIBITOR_LIST,
            payload: response.data
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch exhibitors';

        toast.error(errorMessage);
        return false;
    } finally {
        setLoading(dispatch, false);
    }
};

// Get exhibitor by ID
export const exhibitorById = (id) => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        const response = await axiosInstance.get(`/exhibitors/${id}`);
        dispatch({
            type: EXHIBITOR_BY_ID,
            payload: response.data
        });
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch exhibitor';

        toast.error(errorMessage);
        return false;
    } finally {
        setLoading(dispatch, false);
    }
};

// Create new exhibitor
export const createExhibitor = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/exhibitors/create', data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Exhibitor created successfully!');
            
            // Get the created exhibitor data from response or fetch full details
            let createdExhibitor = response.data?.data;
            
            // If response doesn't have full exhibitor details, fetch it
            if (createdExhibitor?.id) {
                const exhibitorId = createdExhibitor.id;
                const exhibitorResponse = await axiosInstance.get(`/exhibitors/${exhibitorId}`);
                createdExhibitor = exhibitorResponse.data?.data || exhibitorResponse.data;
            }
            
            // Update Redux store directly with the new exhibitor
            if (createdExhibitor?.id) {
                dispatch({
                    type: CREATE_EXHIBITOR,
                    payload: createdExhibitor
                });
                
                return true;
            }
            
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create exhibitor';

        toast.error(errorMessage);
        return false;
    }
};

// Update exhibitor
export const updateExhibitor = (id, data) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/exhibitors/update/${id}`, data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Exhibitor updated successfully!');
            
            // Get the updated exhibitor data from response
            let updatedExhibitor = response.data?.data;
            
            // Only fetch full exhibitor details if response doesn't have exhibitor data at all
            if (!updatedExhibitor || !updatedExhibitor.id) {
                // Only fetch if we don't have basic exhibitor data
                const exhibitorResponse = await axiosInstance.get(`/exhibitors/${id}`);
                updatedExhibitor = exhibitorResponse.data?.data || exhibitorResponse.data;
            }
            
            // Update Redux store directly with the updated exhibitor
            if (updatedExhibitor?.id) {
                dispatch({
                    type: UPDATE_EXHIBITOR,
                    payload: updatedExhibitor
                });
                
                return true;
            }
            
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update exhibitor';

        toast.error(errorMessage);
        return false;
    }
};

// Delete exhibitor
export const deleteExhibitor = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/exhibitors/delete/${id}`);
        if (response && response.status >= 200 && response.status < 300) {
            dispatch({
                type: DELETE_EXHIBITOR,
                payload: id
            });
            toast.success(response.data.message || 'Exhibitor deleted successfully!');
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete exhibitor';

        toast.error(errorMessage);
        return false;
    }
};

// Fetch promotional offers


