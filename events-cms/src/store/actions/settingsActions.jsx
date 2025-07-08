import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { TERMS_CONDITIONS, PRIVACY_POLICY } from "../constants/actionTypes";

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