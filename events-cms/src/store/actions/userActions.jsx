import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { USER_LIST } from '../constants/actionTypes';

export const userList = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/users');
        dispatch({
            type: USER_LIST,
            payload: response.data // Assuming response contains the customers data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors
};

export const createUser = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/auth/register', data);
        console.log({ response });
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'User registered successfully!');
            return true;
        }
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors
};

export const editUser = (id, data) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/users/update/${id}`, data);

        // Check if the response is successful
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'User updated successfully!');
            return response.data; // Return the entire response data
        }
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors or unsuccessful attempts
};

export const deleteUser = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/users/delete/${id}`);
        // Check if the response is successful
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'User deleted successfully!');
            return true; // Indicate successful deletion
        }
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors or unsuccessful attempts
};
