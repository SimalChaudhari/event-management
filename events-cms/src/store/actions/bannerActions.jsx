import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { 
    GET_BANNERS, 
    GET_BANNER_EVENTS, 
    UPLOAD_BANNERS, 
    UPLOAD_BANNER_EVENTS,
    DELETE_BANNER_IMAGE,
    DELETE_BANNER_EVENT_IMAGE,
    CLEAR_ALL_BANNERS,
    CLEAR_ALL_BANNER_EVENTS,
    SET_BANNER_LOADING,
    SET_BANNER_ERROR
} from "../constants/actionTypes";

// Set Loading State
export const setBannerLoading = (loading) => ({
    type: SET_BANNER_LOADING,
    payload: loading
});

// Set Error State
export const setBannerError = (error) => ({
    type: SET_BANNER_ERROR,
    payload: error
});

// Get Banners
export const getBanners = () => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        const response = await axiosInstance.get('/banners');
        dispatch({
            type: GET_BANNERS,
            payload: response.data,
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch banners';
        dispatch(setBannerError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setBannerLoading(false));
    }
    return false;
};

// Get Banner Events
export const getBannerEvents = () => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        const response = await axiosInstance.get('/banner-events');
        dispatch({
            type: GET_BANNER_EVENTS,
            payload: response.data,
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch banner events';
        dispatch(setBannerError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setBannerLoading(false));
    }
    return false;
};

// Upload Banners
export const uploadBanners = (files) => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });

        const response = await axiosInstance.post('/banners', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        dispatch({
            type: UPLOAD_BANNERS,
            payload: response.data.data,
        });
        
        toast.success(response.data.message || 'Banners uploaded successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to upload banners';
        dispatch(setBannerError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setBannerLoading(false));
    }
    return false;
};

// Upload Banner Events
export const uploadBannerEvents = (files) => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });

        const response = await axiosInstance.post('/banner-events', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        dispatch({
            type: UPLOAD_BANNER_EVENTS,
            payload: response.data.data,
        });
        
        toast.success(response.data.message || 'Banner events uploaded successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to upload banner events';
        dispatch(setBannerError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setBannerLoading(false));
    }
    return false;
};

// Delete Specific Banner Image
export const deleteBannerImage = (imageUrl) => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        const response = await axiosInstance.delete('/banners/delete-image', {
            data: { imageUrl }
        });
        
        dispatch({
            type: DELETE_BANNER_IMAGE,
            payload: response.data.data,
        });
        
        toast.success(response.data.message || 'Banner image deleted successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete banner image';
        dispatch(setBannerError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setBannerLoading(false));
    }
    return false;
};

// Delete Specific Banner Event Image
export const deleteBannerEventImage = (imageUrl) => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        const response = await axiosInstance.delete('/banner-events/delete-image', {
            data: { imageUrl }
        });
        
        dispatch({
            type: DELETE_BANNER_EVENT_IMAGE,
            payload: response.data.data,
        });
        
        toast.success(response.data.message || 'Banner event image deleted successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete banner event image';
        dispatch(setBannerError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setBannerLoading(false));
    }
    return false;
};

// Clear All Banners
export const clearAllBanners = () => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        const response = await axiosInstance.delete('/banners/clear-all');
        
        dispatch({
            type: CLEAR_ALL_BANNERS,
            payload: null,
        });
        
        toast.success(response.data.message || 'All banners cleared successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to clear all banners';
        dispatch(setBannerError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setBannerLoading(false));
    }
    return false;
};

// Clear All Banner Events
export const clearAllBannerEvents = () => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        const response = await axiosInstance.delete('/banner-events/clear-all');
        
        dispatch({
            type: CLEAR_ALL_BANNER_EVENTS,
            payload: null,
        });
        
        toast.success(response.data.message || 'All banner events cleared successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to clear all banner events';
        dispatch(setBannerError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setBannerLoading(false));
    }
    return false;
}; 