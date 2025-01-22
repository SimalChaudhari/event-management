
import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { AUTH_DATA } from "../constants/actionTypes";

export const login = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('auth/login', data);
        const token = response?.data?.token;
        localStorage.setItem('userData', JSON.stringify({ user: response?.data?.user }));
        localStorage.setItem('token', token); // Store encrypted name and value
        // Dispatch the authentication action
        dispatch({
            type: AUTH_DATA,
            payload: { user: response?.data?.user },
        });

        if (response) {
            toast.success(response.data.message)
        }
        return { success: true, user: response?.data?.user };

    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'An unexpected error occurred. Please try again.';
        toast.error(errorMessage);
    }
    return false;
};







