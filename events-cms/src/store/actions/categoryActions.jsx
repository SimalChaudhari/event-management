import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { CATEGORY_LIST, CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } from "../constants/actionTypes";

// Get all categories
export const categoryList = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/categories/get');
        dispatch({
            type: CATEGORY_LIST,
            payload: response.data.data,
        });
        return true;
    } catch (error) {
        console.log(error);
        const errorMessage = error?.response?.data?.message || 'Failed to fetch categories';
        toast.error(errorMessage);
    }
    return false;
};

export const categoryById = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/categories/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

// Create new category
export const createCategory = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/categories/create', data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Category created successfully!');
            // Refresh the category list
            await dispatch(categoryList());
            return true;
        }
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create category';
        toast.error(errorMessage);
    }
    return false;
};

// Update category
export const updateCategory = (id, data) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/categories/update/${id}`, data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Category updated successfully!');
            // Refresh the category list
            await dispatch(categoryList());
            return true;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update category';
        toast.error(errorMessage);
    }
    return false;
};

// Delete category
export const deleteCategory = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/categories/delete/${id}`);
        toast.success('Category deleted successfully!');
        // Refresh the category list
        await dispatch(categoryList());
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete category';
        toast.error(errorMessage);
    }
    return false;
}; 