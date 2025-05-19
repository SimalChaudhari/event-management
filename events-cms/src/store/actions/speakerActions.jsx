import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";

export const addSpeaker = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/speakers/create', data);
        console.log({response});
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Speaker added successfully!');
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