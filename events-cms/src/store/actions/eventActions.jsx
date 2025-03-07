import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import {  EVENT_LIST } from "../constants/actionTypes";

export const eventList = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/events');
        dispatch({
            type: EVENT_LIST,
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