import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { AUTH_DATA } from "../constants/actionTypes";
import { CACHE_CONFIG } from "../../configs/env";

export const login = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('auth/admin', data);
        const { accessToken, refreshToken, user } = response.data;
        
        // Store tokens and user data
        localStorage.setItem(CACHE_CONFIG.TOKEN_KEY, accessToken);
        localStorage.setItem(CACHE_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem('userData', JSON.stringify({ user }));
        
        // Dispatch the authentication action
        dispatch({
            type: AUTH_DATA,
            payload: { user },
        });

        toast.success(response.data.message);
        return { success: true, user };

    } catch (error) {
        // Handle specific error cases
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    toast.error('Invalid email or password');
                    break;
                case 400:
                    toast.error(error.response.data.message || 'Please check your credentials');
                    break;
                default:
                    toast.error(error.response.data.message || 'Login failed. Please try again.');
            }
        } else {
            toast.error('Network error. Please check your connection.');
        }
        return { success: false };
    }
};

export const logout = () => async (dispatch) => {
    try {
        // Clear localStorage
        localStorage.removeItem('userData');
        localStorage.removeItem('token');

        // Dispatch to match reducer case
        dispatch({
            type: "LOGOUT",
            payload: {
                authenticated: false,
                authUser: '',
            }
        });

        toast.success('Logged out successfully');
        return { success: true };

    } catch (error) {
        toast.error('Error logging out');
        return { success: false };
    }
};

export const forgetPassword = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/auth/forget', data);
       if (response.data) {
            toast.success(response.data.message);
            return { success: true };
        } else {
            toast.error(response.data.message || 'Failed to send reset link');
            return { success: false };
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'An error occurred. Please try again.';
        toast.error(errorMessage);
        return { success: false };
    }
};

export const verifyOtp = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('auth/verify-otp', data);
        if (response.data.success) {
            toast.success(response.data.message || 'OTP verified successfully');
            return { success: true };
        } else {
            toast.error(response.data.message);
            return { success: false };
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'An error occurred. Please try again.';
        toast.error(errorMessage);
        return { success: false };
    }
};

export const verifyEmailOTP = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('auth/verify-email-otp', data);
        if (response.data.success) {
            toast.success(response.data.message || 'Email verified successfully');
            return { success: true };
        } else {
            toast.error(response.data.message);
            return { success: false };
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'An error occurred. Please try again.';
        toast.error(errorMessage);
        return { success: false };
    }
};

export const resendVerificationOTP = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('auth/resend-verification-otp', data);
        if (response.data.success) {
            toast.success(response.data.message || 'OTP sent successfully');
            return { success: true };
        } else {
            toast.error(response.data.message);
            return { success: false };
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'An error occurred. Please try again.';
        toast.error(errorMessage);
        return { success: false };
    }
};

export const resetPassword = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/auth/reset', data);
        if (response.data) {
            toast.success(response.data.message || 'Password reset successfully');
            return { success: true };
        } else {
            toast.error(response.data.message || 'Failed to reset password');
            return { success: false };
        }
    } catch (error) {
        // console.log(error);
        return { success: false };
    }
};

export const changePassword = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/change-password', data);
        
        if (response.data.success) {
            toast.success(response.data.message);
            return { success: true };
        } else {
            toast.error(response.data.message);
            return { success: false };
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message ;
        toast.error(errorMessage);
    }
    return false;
};

export const checkAuthStatus = () => async (dispatch) => {
    try {
        // Set loading to true initially
        dispatch({
            type: "SET_LOADING",
            payload: true
        });

        const token = localStorage.getItem(CACHE_CONFIG.TOKEN_KEY);
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            try {
                const user = JSON.parse(userData).user;
                dispatch({
                    type: AUTH_DATA,
                    payload: { user }
                });
                return true;
            } catch (parseError) {
                console.error('Failed to parse user data:', parseError);
                // Clear invalid data
                localStorage.removeItem(CACHE_CONFIG.TOKEN_KEY);
                localStorage.removeItem('userData');
                dispatch({
                    type: "LOGOUT"
                });
                return false;
            }
        } else {
            // No token or user data, set loading to false
            dispatch({
                type: "SET_LOADING",
                payload: false
            });
            return false;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        // Set loading to false on error
        dispatch({
            type: "SET_LOADING",
            payload: false
        });
        return false;
    }
};




