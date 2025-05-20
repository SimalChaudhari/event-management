import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import {  WITHDRAWAL_LIST } from "../constants/actionTypes";

export const WithdrawalList = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/withdrawal');
        dispatch({
            type: WITHDRAWAL_LIST,
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

export const updateWithdrawalStatus = (id, status) => async (dispatch) => {
    try {
       await axiosInstance.put(`/withdrawal/manage/${id}`, { status });
        // Refresh the withdrawal list after status update
        dispatch(WithdrawalList());
        // toast.success('Status updated successfully');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update status';
        toast.error(errorMessage);
        return false;
    }
};













