import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import {  EVENT_LIST, PARTICIPATED_EVENTS } from "../constants/actionTypes";

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




export const participatedEvents = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/register-events/get');
        dispatch({
            type: PARTICIPATED_EVENTS,
            payload: response.data,
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message || 'An unexpected error occurred. Please try again.';
        toast.error(errorMessage);
    }
    return false; // Return false for any errors
};



// All Filter Delete Events

export const eventDelete = (eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/${eventId}`);
        dispatch({ type: 'EVENT_DELETE_SUCCESS', payload: response.data });
        return response.data;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};

export const registrationDelete = (registrationId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/register-events/${registrationId}`);
        dispatch({ type: 'REGISTRATION_DELETE_SUCCESS', payload: response.data });
        return response.data;
    } catch (error) {   
        console.error('Error deleting registration:', error);
        throw error;
    }
};  











