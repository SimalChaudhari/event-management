import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { TERMS_CONDITIONS, PRIVACY_POLICY, LOGO_GET, LOGO_UPDATE, LOGO_DELETE, LOGO_LOADING, LOGO_ERROR, CLEAR_LOGO_ERROR } from "../constants/actionTypes";

// Get Terms & Conditions
export const getTermsConditions = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/terms-conditions');
        dispatch({
            type: TERMS_CONDITIONS,
            payload: response.data,
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch Terms & Conditions';
        toast.error(errorMessage);
    }
    return false;
};

// Save Terms & Conditions
export const saveTermsConditions = (content) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/terms-conditions', {
            content: content
        });
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Terms & Conditions saved successfully!');
            // Refresh the data after saving
            await dispatch(getTermsConditions());
            return true;
        }
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to save Terms & Conditions';
        toast.error(errorMessage);
    }
    return false;
};

// Get Privacy Policy
export const getPrivacyPolicy = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/privacy-policies');
        dispatch({
            type: PRIVACY_POLICY,
            payload: response.data,
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch Privacy Policy';
        toast.error(errorMessage);
    }
    return false;
};

// Save Privacy Policy
export const savePrivacyPolicy = (content) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/privacy-policies', {
            content: content
        });
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Privacy Policy saved successfully!');
            // Refresh the data after saving
            await dispatch(getPrivacyPolicy());
            return true;
        }
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to save Privacy Policy';
        toast.error(errorMessage);
    }
    return false;
};

// Logo Management Actions

// Helper function to dispatch loading state
const setLogoLoading = (dispatch, loading) => {
    dispatch({
        type: LOGO_LOADING,
        payload: loading
    });
};

// Helper function to dispatch error state
const setLogoError = (dispatch, error) => {
    dispatch({
        type: LOGO_ERROR,
        payload: error
    });
};

// Get logo
export const getLogo = () => async (dispatch) => {
    try {
        setLogoLoading(dispatch, true);
        const response = await axiosInstance.get('/logos');
        dispatch({
            type: LOGO_GET,
            payload: response.data,
        });
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch logo';
        setLogoError(dispatch, errorMessage);
        toast.error(errorMessage);
        return null;
    } finally {
        setLogoLoading(dispatch, false);
    }
};

// Update logo
export const updateLogo = (formData) => async (dispatch) => {
    try {
        setLogoLoading(dispatch, true);
        const response = await axiosInstance.post('/logos', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Logo updated successfully!');
            dispatch({
                type: LOGO_UPDATE,
                payload: response.data.data,
            });
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update logo';
        setLogoError(dispatch, errorMessage);
        toast.error(errorMessage);
        return false;
    } finally {
        setLogoLoading(dispatch, false);
    }
};

// Delete logo
export const deleteLogo = () => async (dispatch) => {
    try {
        setLogoLoading(dispatch, true);
        const response = await axiosInstance.delete('/logos/delete');
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Logo deleted successfully!');
            dispatch({
                type: LOGO_DELETE,
            });
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete logo';
        setLogoError(dispatch, errorMessage);
        toast.error(errorMessage);
        return false;
    } finally {
        setLogoLoading(dispatch, false);
    }
};

// Clear logo error
export const clearLogoError = () => (dispatch) => {
    dispatch({
        type: CLEAR_LOGO_ERROR
    });
}; 