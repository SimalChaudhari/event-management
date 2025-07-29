import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { 
    FETCH_PROMOTIONAL_OFFERS,
    CREATE_PROMOTIONAL_OFFER,
    UPDATE_PROMOTIONAL_OFFER,
    DELETE_PROMOTIONAL_OFFER,
    GET_PROMOTIONAL_OFFERS_BY_EXHIBITOR
} from '../constants/actionTypes';

// Get all promotional offers (Gallery pattern जैसा)
export const getAllPromotionalOffers = () => async (dispatch) => {
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
};

// Get promotional offers by exhibitor ID 
export const getPromotionalOffersByExhibitor = (exhibitorId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/promotional-offers?exhibitorId=${exhibitorId}`);
        dispatch({
            type: GET_PROMOTIONAL_OFFERS_BY_EXHIBITOR,
            payload: { exhibitorId, data: response.data }
        });
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch promotional offers';
        toast.error(errorMessage);
        return false;
    }
};

// Get promotional offer by ID (Gallery pattern जैसा)
export const getPromotionalOfferById = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/promotional-offers/${id}`);
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch promotional offer';
        toast.error(errorMessage);
        return false;
    }
};

// Create or Update promotional offer (Gallery pattern जैसा)
export const createOrUpdatePromotionalOffer = (data, id = null) => async (dispatch) => {
    try {
        let response;
        if (id) {
            // Update
            response = await axiosInstance.put(`/promotional-offers/update/${id}`, data);
        } else {
            // Create
            response = await axiosInstance.post('/promotional-offers/create', data);
        }
        
        if (response && response.status >= 200 && response.status < 300) {
            const actionType = id ? UPDATE_PROMOTIONAL_OFFER : CREATE_PROMOTIONAL_OFFER;
            dispatch({
                type: actionType,
                payload: response.data.data
            });
            toast.success(response.data.message || `Promotional offer ${id ? 'updated' : 'created'} successfully!`);
            return response.data;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || `Failed to ${id ? 'update' : 'create'} promotional offer`;
        toast.error(errorMessage);
        return false;
    }
};

// Delete promotional offer
export const deletePromotionalOffer = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/promotional-offers/delete/${id}`);
        if (response && response.status >= 200 && response.status < 300) {
            dispatch({
                type: DELETE_PROMOTIONAL_OFFER,
                payload: id
            });
            toast.success(response.data.message || 'Promotional offer deleted successfully!');
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete promotional offer';
        toast.error(errorMessage);
        return false;
    }
}; 