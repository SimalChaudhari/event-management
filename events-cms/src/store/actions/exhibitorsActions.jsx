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
import { buildUrlWithParams } from '../../utils/buildQueryParams';

// Helper function to dispatch loading state
const setLoading = (dispatch, loading) => {
    dispatch({
        type: EXHIBITOR_LOADING,
        payload: loading
    });
};

// Get all exhibitors with pagination support
export const exhibitorList = (filters = {}) => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        
        // Build URL with query parameters
        const url = buildUrlWithParams('/exhibitors', filters);
        
        const response = await axiosInstance.get(url);
        
        dispatch({
            type: EXHIBITOR_LIST,
            payload: {
                data: response.data?.data || [],
                pagination: response.data?.metadata || {}
            }
        });
        
        return {
            success: true,
            data: response.data?.data || [],
            pagination: response.data?.metadata || {}
        };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch exhibitors';
        toast.error(errorMessage);
        return {
            success: false,
            data: [],
            pagination: {}
        };
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

// Delete flyer by ID
export const deleteExhibitorFlyer = (exhibitorId, flyerId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/exhibitors/flyers/${exhibitorId}`, {
            data: { flyerId }
        });
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Flyer deleted successfully!');
            // Update Redux store with the updated exhibitor data from response
            if (response.data?.data) {
                dispatch({
                    type: EXHIBITOR_BY_ID,
                    payload: { data: response.data.data }
                });
            }
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete flyer';
        toast.error(errorMessage);
        return false;
    }
};

// Delete document by ID
export const deleteExhibitorDocument = (exhibitorId, documentId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/exhibitors/documents/${exhibitorId}`, {
            data: { documentId }
        });
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Document deleted successfully!');
            // Update Redux store with the updated exhibitor data from response
            if (response.data?.data) {
                dispatch({
                    type: EXHIBITOR_BY_ID,
                    payload: { data: response.data.data }
                });
            }
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete document';
        toast.error(errorMessage);
        return false;
    }
};

// Delete event image by ID
export const deleteExhibitorEventImage = (exhibitorId, eventImageId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/exhibitors/eventImages/${exhibitorId}`, {
            data: { eventImageId }
        });
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Event image deleted successfully!');
            // Update Redux store with the updated exhibitor data from response
            if (response.data?.data) {
                dispatch({
                    type: EXHIBITOR_BY_ID,
                    payload: { data: response.data.data }
                });
            }
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete event image';
        toast.error(errorMessage);
        return false;
    }
};

// Download single flyer
export const downloadFlyer = async (exhibitorId, flyerId) => {
    try {
        const response = await axiosInstance.get(
            `/exhibitors/flyers/${exhibitorId}/${flyerId}/download`,
            {
                responseType: 'blob'
            }
        );
        if (response.status === 200) {
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `flyer-${flyerId}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success('Flyer downloaded successfully');
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to download flyer';
        toast.error(errorMessage);
    }
};

// Download all flyers as ZIP
export const downloadAllFlyers = async (exhibitorId) => {
    try {
        const response = await axiosInstance.get(
            `/exhibitors/flyers/${exhibitorId}/download-all`,
            {
                responseType: 'blob'
            }
        );
        if (response.status === 200) {
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `exhibitor-${exhibitorId}-flyers.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success('Flyers downloaded successfully');
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to download flyers';
        toast.error(errorMessage);
    }
};

// Download single document
export const downloadDocument = async (exhibitorId, documentId) => {
    try {
        const response = await axiosInstance.get(
            `/exhibitors/documents/${exhibitorId}/${documentId}/download`,
            {
                responseType: 'blob'
            }
        );
        if (response.status === 200) {
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `document-${documentId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success('Document downloaded successfully');
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to download document';
        toast.error(errorMessage);
    }
};

// Download all documents as ZIP
export const downloadAllDocuments = async (exhibitorId) => {
    try {
        const response = await axiosInstance.get(
            `/exhibitors/documents/${exhibitorId}/download-all`,
            {
                responseType: 'blob'
            }
        );
        if (response.status === 200) {
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `exhibitor-${exhibitorId}-documents.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success('Documents downloaded successfully');
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to download documents';
        toast.error(errorMessage);
    }
};

// Download single event image
export const downloadEventImage = async (exhibitorId, eventImageId) => {
    try {
        const response = await axiosInstance.get(
            `/exhibitors/eventImages/${exhibitorId}/${eventImageId}/download`,
            {
                responseType: 'blob'
            }
        );
        if (response.status === 200) {
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `event-image-${eventImageId}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success('Event image downloaded successfully');
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to download event image';
        toast.error(errorMessage);
    }
};

// Download all event images as ZIP
export const downloadAllEventImages = async (exhibitorId) => {
    try {
        const response = await axiosInstance.get(
            `/exhibitors/eventImages/${exhibitorId}/download-all`,
            {
                responseType: 'blob'
            }
        );
        if (response.status === 200) {
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `exhibitor-${exhibitorId}-event-images.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success('Event images downloaded successfully');
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to download event images';
        toast.error(errorMessage);
    }
};

// Delete booth banner by ID
export const deleteExhibitorBoothBanner = (exhibitorId, bannerId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/exhibitors/boothBanner/${exhibitorId}/${bannerId}`);
        if (response.status === 200 && response.data?.success) {
            toast.success('Booth banner deleted successfully');
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete booth banner';
        toast.error(errorMessage);
        return false;
    }
};

// Delete all booth banners
export const deleteAllExhibitorBoothBanners = (exhibitorId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/exhibitors/boothBanner/${exhibitorId}/all`);
        if (response.status === 200 && response.data?.success) {
            toast.success('All booth banners deleted successfully');
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete all booth banners';
        toast.error(errorMessage);
        return false;
    }
};

// Fetch promotional offers


