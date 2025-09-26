import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { AUTH_DATA, AUTH_LOADING, AUTH_ERROR } from "../constants/actionTypes";
import { CACHE_CONFIG } from "../../configs/env";

// Helper function to dispatch loading state
const setLoading = (dispatch, loading) => {
    dispatch({
        type: AUTH_LOADING,
        payload: loading
    });
};


export const login = (data) => async (dispatch) => {
    try {
        setLoading(dispatch, true);
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
       
        toast.error(error.response.data.message);
        return { success: false };
    } finally {
        setLoading(dispatch, false);
    }
};

export const logout = () => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        
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
        const errorMessage = 'Error logging out';
        toast.error(errorMessage);
      
        return { success: false };
    } finally {
        setLoading(dispatch, false);
    }
};

export const forgetPassword = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/auth/forgot-password', data);
        
        if (response.data) {
            toast.success(response.data.message || 'OTP sent successfully');
            return { success: true };
        } else {
            const errorMessage = response.data?.message || 'Failed to send reset link';
            toast.error(errorMessage);
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
        setLoading(dispatch, true);
        
        const response = await axiosInstance.post('auth/verify-otp', data);
        if (response.data.success) {
            toast.success(response.data.message || 'OTP verified successfully');
            return { success: true };
        } else {
            const errorMessage = response.data.message;
            toast.error(errorMessage);
          
            return { success: false };
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'An error occurred. Please try again.';
        toast.error(errorMessage);
      
        return { success: false };
    } finally {
        setLoading(dispatch, false);
    }
};

export const verifyEmailOTP = (data) => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        
        const response = await axiosInstance.post('auth/verify-email-otp', data);
        if (response.data.success) {
            toast.success(response.data.message || 'Email verified successfully');
            return { success: true };
        } else {
            const errorMessage = response.data.message;
            toast.error(errorMessage);
          
            return { success: false };
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'An error occurred. Please try again.';
        toast.error(errorMessage);
      
        return { success: false };
    } finally {
        setLoading(dispatch, false);
    }
};

export const resendVerificationOTP = (data) => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        
        const response = await axiosInstance.post('auth/resend-verification-otp', data);
        if (response.data.success) {
            toast.success(response.data.message || 'OTP sent successfully');
            return { success: true };
        } else {
            const errorMessage = response.data.message;
            toast.error(errorMessage);
          
            return { success: false };
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'An error occurred. Please try again.';
        toast.error(errorMessage);
      
        return { success: false };
    } finally {
        setLoading(dispatch, false);
    }
};

export const resetPassword = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/auth/reset-password', data);
        console.log('Reset password API response:', response.data);
        
        if (response.data) {
            toast.success(response.data.message || 'Password reset successfully');
            return { success: true };
        } else {
            const errorMessage = response.data?.message || 'Failed to reset password';
            toast.error(errorMessage);
            return { success: false };
        }
    } catch (error) {
        console.error('Reset password error:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to reset password';
        toast.error(errorMessage);
        return { success: false };
    }
};

export const changePassword = (data) => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        
        const response = await axiosInstance.post('/change-password', data);
        
        if (response.data.success) {
            toast.success(response.data.message);
            return { success: true };
        } else {
            const errorMessage = response.data.message;
            toast.error(errorMessage);
          
            return { success: false };
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to change password';
        toast.error(errorMessage);
      
        return { success: false };
    } finally {
        setLoading(dispatch, false);
    }
};

export const checkAuthStatus = () => async (dispatch) => {
    try {
        // Set loading to true initially
        setLoading(dispatch, true);
        

        const token = localStorage.getItem(CACHE_CONFIG.TOKEN_KEY);
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            try {
                const user = JSON.parse(userData).user;
                dispatch({
                    type: AUTH_DATA,
                    payload: { user }
                });
                // Set loading to false after successful auth data dispatch
                setLoading(dispatch, false);
                return true;
            } catch (parseError) {
                console.error('Failed to parse user data:', parseError);
                // Clear invalid data
                localStorage.removeItem(CACHE_CONFIG.TOKEN_KEY);
                localStorage.removeItem('userData');
                dispatch({
                    type: "LOGOUT"
                });
              
                setLoading(dispatch, false);
                return false;
            }
        } else {
            // No token or user data, set loading to false
            setLoading(dispatch, false);
            return false;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        // Set loading to false on error
        setLoading(dispatch, false);
        return false;
    }
};




