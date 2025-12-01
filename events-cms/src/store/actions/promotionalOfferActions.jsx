import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { 
    FETCH_PROMOTIONAL_OFFERS,
    CREATE_PROMOTIONAL_OFFER,
    UPDATE_PROMOTIONAL_OFFER,
    DELETE_PROMOTIONAL_OFFER,
    GET_PROMOTIONAL_OFFERS_BY_EXHIBITOR,
    PROMOTIONAL_OFFER_BY_ID,
    PROMOTIONAL_OFFER_LOADING,
} from '../constants/actionTypes';

// Helper function to dispatch loading state
const setLoading = (dispatch, loading) => {
    dispatch({
        type: PROMOTIONAL_OFFER_LOADING,
        payload: loading
    });
};

// Get all promotional offers
export const getAllPromotionalOffers = () => async (dispatch) => {
    try {
        setLoading(dispatch, true);
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
    } finally {
        setLoading(dispatch, false);
    }
};

// Get promotional offers by exhibitor ID 
export const getPromotionalOffersByExhibitor = (exhibitorId) => async (dispatch) => {
    try {
        setLoading(dispatch, true);
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
    } finally {
        setLoading(dispatch, false);
    }
};

// Get promotional offer by ID
export const getPromotionalOfferById = (id) => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        const response = await axiosInstance.get(`/promotional-offers/${id}`);
        dispatch({
            type: PROMOTIONAL_OFFER_BY_ID,
            payload: response.data
        });
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch promotional offer';
       
        toast.error(errorMessage);
        return false;
    } finally {
        setLoading(dispatch, false);
    }
};

// Create promotional offer
export const createPromotionalOffer = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/promotional-offers/create', data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Promotional offer created successfully!');
            
            // Get the created offer data from response - use it directly, no need to fetch again
            const createdOffer = response.data?.data;
            
            // Update Redux store directly with the new offer from response
            if (createdOffer?.id) {
                dispatch({
                    type: CREATE_PROMOTIONAL_OFFER,
                    payload: createdOffer
                });
                
                return true;
            }
            
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create promotional offer';
       
        toast.error(errorMessage);
        return false;
    } 
};

// Update promotional offer
export const updatePromotionalOffer = (id, data) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/promotional-offers/update/${id}`, data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Promotional offer updated successfully!');
            
            // Get the updated offer data from response - use it directly, no need to fetch again
            const updatedOffer = response.data?.data;
            
            // Update Redux store directly with the updated offer from response
            if (updatedOffer?.id) {
                dispatch({
                    type: UPDATE_PROMOTIONAL_OFFER,
                    payload: updatedOffer
                });
                
                return response.data;
            }
            
            return response.data;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update promotional offer';
       
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