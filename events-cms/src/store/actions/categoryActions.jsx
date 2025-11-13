import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { CATEGORY_LIST, CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY, CATEGORY_LOADING } from "../constants/actionTypes";

// Helper function to dispatch loading state
const setCategoryLoading = (dispatch, loading) => {
    dispatch({
        type: CATEGORY_LOADING,
        payload: loading
    });
};

// Get all categories
export const categoryList = () => async (dispatch) => {
    try {
        setCategoryLoading(dispatch, true);
        const response = await axiosInstance.get('/categories/get');
        dispatch({
            type: CATEGORY_LIST,
            payload: response.data.data,
        });
        return true;
    } catch (error) {
        
        const errorMessage = error?.response?.data?.message || 'Failed to fetch categories';
        toast.error(errorMessage);
    } finally {
        setCategoryLoading(dispatch, false);
    }
    return false;
};

export const categoryById = (id) => async (dispatch) => {
    try {
        setCategoryLoading(dispatch, true);
        const response = await axiosInstance.get(`/categories/${id}`);
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch category details';
        toast.error(errorMessage);
        throw error;
    } finally {
        setCategoryLoading(dispatch, false);
    }
}

// Create new category
export const createCategory = (data) => async (dispatch) => {
    try {
        setCategoryLoading(dispatch, true);
        const response = await axiosInstance.post('/categories/create', data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Category created successfully!');
            
            // Get the created category data from response
            let newCategory = response.data?.data || response.data?.category || response.data;
            
            // If response doesn't have full category details, fetch it (similar to event pattern)
            if (newCategory?.id && !newCategory.name) {
                const categoryResponse = await axiosInstance.get(`/categories/${newCategory.id}`);
                newCategory = categoryResponse.data?.data || categoryResponse.data;
            }
            
            // Update Redux store directly with the new category (NO fetch API call)
            if (newCategory?.id) {
                dispatch({
                    type: CREATE_CATEGORY,
                    payload: newCategory
                });
                return { success: true, category: newCategory };
            }
            
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create category';
        toast.error(errorMessage);
        return { success: false };
    } finally {
        setCategoryLoading(dispatch, false);
    }
};

// Update category
export const updateCategory = (id, data) => async (dispatch) => {
    try {
        setCategoryLoading(dispatch, true);
        const response = await axiosInstance.put(`/categories/update/${id}`, data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Category updated successfully!');
            
            // Get the updated category data from response or fetch full details (similar to event pattern)
            let updatedCategory = response.data?.data || response.data?.category || response.data;
            
            // If response doesn't have full category details, fetch it
            if (!updatedCategory || !updatedCategory.name) {
                const categoryResponse = await axiosInstance.get(`/categories/${id}`);
                updatedCategory = categoryResponse.data?.data || categoryResponse.data;
            }
            
            // Ensure the category object has the id
            if (updatedCategory && !updatedCategory.id) {
                updatedCategory = { ...updatedCategory, id: id };
            }
            
            // Update Redux store directly with the updated category (NO fetch API call)
            if (updatedCategory?.id) {
                dispatch({
                    type: UPDATE_CATEGORY,
                    payload: updatedCategory
                });
                return { success: true, category: updatedCategory };
            }
            
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update category';
        toast.error(errorMessage);
        return { success: false };
    } finally {
        setCategoryLoading(dispatch, false);
    }
};

// Delete category
export const deleteCategory = (id) => async (dispatch) => {
    try {
        setCategoryLoading(dispatch, true);
        await axiosInstance.delete(`/categories/delete/${id}`);
        toast.success('Category deleted successfully!');
        // Update Redux store directly by removing the category
        dispatch({
            type: DELETE_CATEGORY,
            payload: id
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete category';
        toast.error(errorMessage);
        return false;
    } finally {
        setCategoryLoading(dispatch, false);
    }
}; 