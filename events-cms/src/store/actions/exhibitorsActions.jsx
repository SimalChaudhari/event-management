import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { 
    EXHIBITOR_LIST, 
    EXHIBITOR_BY_ID, 
    CREATE_EXHIBITOR, 
    UPDATE_EXHIBITOR, 
    DELETE_EXHIBITOR, 
    FETCH_PROMOTIONAL_OFFERS
} from '../constants/actionTypes';

// Get all exhibitors
export const exhibitorList = () => async (dispatch) => {
    try {
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
    }
};

// Get exhibitor by ID
export const exhibitorById = (id) => async (dispatch) => {
    try {
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
    }
};

// Create new exhibitor
export const createExhibitor = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/exhibitors/create', data);
        if (response && response.status >= 200 && response.status < 300) {
            dispatch({
                type: CREATE_EXHIBITOR,
                payload: response.data.data
            });
            toast.success(response.data.message || 'Exhibitor created successfully!');
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
            dispatch({
                type: UPDATE_EXHIBITOR,
                payload: response.data.data
            });
            toast.success(response.data.message || 'Exhibitor updated successfully!');
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


export const fetchPromotional = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/promotional-offers');
        dispatch({
            type: FETCH_PROMOTIONAL_OFFERS,
            payload: response.data
        });
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch promotional offers';
        toast.error(errorMessage);
        return false;
    }
}