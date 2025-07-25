import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { GALLERY_LIST, GALLERY_BY_ID, ALL_GALLERIES } from '../constants/actionTypes';

export const galleryList = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/gallery');
        dispatch({
            type: GALLERY_LIST,
            payload: response.data
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

export const galleryByEvent =
    (eventId, filters = {}) =>
    async (dispatch) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = queryParams ? `/gallery/event/${eventId}?${queryParams}` : `/gallery/event/${eventId}`;
            const response = await axiosInstance.get(url);
            dispatch({
                type: GALLERY_BY_ID,
                payload: response.data
            });
            return response.data;
        } catch (error) {
            const errorMessage = error?.response?.data?.message;
            toast.error(errorMessage);
        }
        return false;
    };

export const getAllGalleries = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/gallery/get-all');

        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

export const getGalleryById = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/gallery/${id}`);
        return response?.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

export const createOrUpdateGallery = (data , id) => async (dispatch) => {
    console.log({data});
    try {
        const response = await axiosInstance.post(`/gallery/create-or-update/${id}`, data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Gallery saved successfully!');
            await dispatch(getAllGalleries());
            return true;
        }
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

export const deleteGallery = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/gallery/delete/${id}`);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Gallery deleted successfully!');
            await dispatch(getAllGalleries());
            return true;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

export const deleteGalleryImage = (galleryId, imagePath) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/gallery/delete-image/${galleryId}`, {
            data: { imagePath }
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Image removed successfully!');
            // Return the updated gallery data from response
            return response.data.data;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage || 'Error removing image');
    }
    return false;
};

export const clearAllGalleryImages = (galleryId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/gallery/clear/${galleryId}`);

        if (response && response.status >= 200 && response.status < 300) {
            toast.success('All images cleared successfully!');
            // Return the updated gallery data from response
            return response.data.data;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage || 'Error clearing images');
    }
    return false;
};

export const getAllGalleryItems =
    (filters = {}) =>
    async (dispatch) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = queryParams ? `/gallery?${queryParams}` : '/gallery';
            const response = await axiosInstance.get(url);
            dispatch({
                type: GALLERY_LIST,
                payload: response.data
            });
            return response.data;
        } catch (error) {
            const errorMessage = error?.response?.data?.message;
            toast.error(errorMessage);
        }
        return false;
    };
