import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import {  USER_LIST } from "../constants/actionTypes";

export const userList = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/users');
        dispatch({
            type: USER_LIST,
            payload: response.data, // Assuming response contains the customers data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message || 'An unexpected error occurred. Please try again.';
        toast.error(errorMessage);
    }
    return false; // Return false for any errors
};

export const createUser = (userData) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/auth/register', userData);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'User registered successfully!');
            return true;
        }
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message || 'An unexpected error occurred. Please try again.';
        toast.error(errorMessage);
    }
    return false; // Return false for any errors
};

export const editUser = (userId, userData) => async (dispatch) => {
    try {
        const response = await axiosInstance.patch(`/users/update/${userId}`, userData);

        // Check if the response is successful
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'User updated successfully!');
            return true; // Indicate successful update
        }
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message || 'An unexpected error occurred. Please try again.';
        toast.error(errorMessage);
    }
    return false; // Return false for any errors or unsuccessful attempts
};

export const deleteUser = (userId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/users/delete/${userId}`);
        // Check if the response is successful
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'User deleted successfully!');
            return true; // Indicate successful deletion
        }
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message || 'An unexpected error occurred. Please try again.';
        toast.error(errorMessage);
    }
    return false; // Return false for any errors or unsuccessful attempts
};