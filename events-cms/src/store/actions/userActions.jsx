import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { USER_LIST, USER_LOADING, USER_ERROR, CREATE_USER, UPDATE_USER, DELETE_USER, USER_BY_ID } from '../constants/actionTypes';

// Helper function to dispatch loading state
const setLoading = (dispatch, loading) => {
    dispatch({
        type: USER_LOADING,
        payload: loading
    });
};

export const userList = () => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.get('/users');
        dispatch({
            type: USER_LIST,
            payload: response.data?.data
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch users';
        toast.error(errorMessage);
        return false;
    } finally {
        setLoading(dispatch, false);
    }
};

export const userById = (id) => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        const response = await axiosInstance.get(`/users/get/${id}`);
        dispatch({
            type: USER_BY_ID,
            payload: response.data?.data
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch user details';
        toast.error(errorMessage);

        return null;
    } finally {
        setLoading(dispatch, false);
    }
};

export const createUser = (userData) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/auth/register-admin', userData);
        dispatch({
            type: CREATE_USER,
            payload: response.data?.data
        });
        toast.success('User created successfully');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create user';
        toast.error(errorMessage);
        return false;
    }
};

export const editUser = (id, userData) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/users/update/${id}`, userData);
        dispatch({
            type: UPDATE_USER,
            payload: response.data?.data
        });
        toast.success('User updated successfully');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update user';
        toast.error(errorMessage);
        return false;
    }
};

export const deleteUser = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/users/delete/${id}`);
        dispatch({
            type: DELETE_USER,
            payload: id
        });
        toast.success('User deleted successfully');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete user';
        toast.error(errorMessage);

        return false;
    }
};
