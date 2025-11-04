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

// Get Banners by type
export const getBanners = (type = 'home') => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        const response = await axiosInstance.get(`/banners/${type}`);
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
        const response = await axiosInstance.get('/banners/event');
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
export const uploadBanners = (files, hyperlinks, type = 'home') => async dispatch => {
    try {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });
        
        // Add hyperlinks array to formData if provided
        if (hyperlinks && hyperlinks.length > 0) {
            // Send as JSON string for array handling
            formData.append('hyperlinks', JSON.stringify(hyperlinks));
        }

        const response = await axiosInstance.post(`/banners/${type}`, formData);
        dispatch({ type: UPLOAD_BANNERS, payload: response.data.data });
        toast.success(response.data.message || 'Banners uploaded successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to upload banners';
        dispatch({ type: SET_BANNER_ERROR, payload: errorMessage });
        toast.error(errorMessage);
        return false;
    }
};

// Upload Banner Events
export const uploadBannerEvents = (files, hyperlinks) => async (dispatch) => {
    try {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });
        
        // Add hyperlinks array to formData if provided
        if (hyperlinks && hyperlinks.length > 0) {
            // Send as JSON string for array handling
            formData.append('hyperlinks', JSON.stringify(hyperlinks));
        }

        const response = await axiosInstance.post('/banners/event', formData);
        
        dispatch({
            type: UPLOAD_BANNER_EVENTS,
            payload: response.data.data,
        });
        
        toast.success(response.data.message || 'Banner events uploaded successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to upload banner events';
        toast.error(errorMessage);
    }
    return false;
};

// Delete Specific Banner Image
export const deleteBannerImage = (imageUrl, type = 'home') => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        const response = await axiosInstance.delete(`/banners/${type}/delete-image`, {
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

// Update Banner Hyperlink
export const updateBannerHyperlink = (imageUrl, hyperlink, type = 'home') => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        console.log('Updating banner hyperlink:', { imageUrl, hyperlink, type });
        
        const response = await axiosInstance.put(`/banners/${type}/update-hyperlink`, {
            imageUrl,
            hyperlink: hyperlink || ''
        });
        
        console.log('Banner hyperlink update response:', response.data);
        
        dispatch({
            type: GET_BANNERS,
            payload: response.data.data,
        });
        
        toast.success(response.data.message || 'Hyperlink updated successfully!');
        return true;
    } catch (error) {
        console.error('Error updating banner hyperlink:', error);
        console.error('Error details:', {
            message: error?.message,
            response: error?.response,
            request: error?.request,
            config: error?.config
        });
        
        const errorMessage = error?.response?.data?.message 
            || error?.message 
            || 'Failed to update hyperlink';
        dispatch(setBannerError(errorMessage));
        toast.error(errorMessage);
        return false;
    } finally {
        dispatch(setBannerLoading(false));
    }
};

// Delete Specific Banner Event Image
export const deleteBannerEventImage = (imageUrl) => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        const response = await axiosInstance.delete('/banners/event/delete-image', {
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

// Update Banner Event Hyperlink
export const updateBannerEventHyperlink = (imageUrl, hyperlink) => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        console.log('Updating hyperlink:', { imageUrl, hyperlink });
        
        const response = await axiosInstance.put('/banners/event/update-hyperlink', {
            imageUrl,
            hyperlink: hyperlink || ''
        });
        
        console.log('Hyperlink update response:', response.data);
        
        dispatch({
            type: GET_BANNER_EVENTS,
            payload: response.data.data,
        });
        
        toast.success(response.data.message || 'Hyperlink updated successfully!');
        return true;
    } catch (error) {
        console.error('Error updating hyperlink:', error);
        console.error('Error details:', {
            message: error?.message,
            response: error?.response,
            request: error?.request,
            config: error?.config
        });
        
        const errorMessage = error?.response?.data?.message 
            || error?.message 
            || 'Failed to update hyperlink';
        dispatch(setBannerError(errorMessage));
        toast.error(errorMessage);
        return false;
    } finally {
        dispatch(setBannerLoading(false));
    }
};

// Clear All Banners
export const clearAllBanners = (type = 'home') => async (dispatch) => {
    try {
        dispatch(setBannerLoading(true));
        
        const response = await axiosInstance.delete(`/banners/${type}/clear-all`);
        
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
        
        const response = await axiosInstance.delete('/banners/event/clear-all');
        
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