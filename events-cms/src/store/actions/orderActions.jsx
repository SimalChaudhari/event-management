import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import {  ORDER_LIST } from "../constants/actionTypes";

export const orderList = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/orders');
        dispatch({
            type: ORDER_LIST,
            payload: response.data, // Assuming response contains the customers data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message ;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors
};

// All Filter Delete Orders
export const orderDelete = (id) => async (dispatch) => {
    try {
         await axiosInstance.delete(`/orders/delete/${id}`);
         return true;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};











