import { toast } from "react-toastify";
import axiosInstance from "../../configs/axiosInstance";
import { ORDER_LIST, ORDER_LOADING } from "../constants/actionTypes";

/**
 * Fetch orders with optional pagination and filters.
 * @param {Object} params - { page, limit, sortBy, sortOrder, search, status, dateFrom, dateTo }
 * @returns {Object|boolean} - { data, total, page, limit, totalPages } or false on error
 */
export const orderList = (params = {}) => async (dispatch) => {
    dispatch({ type: ORDER_LOADING, payload: true });
    try {
        const query = new URLSearchParams();
        if (params.page != null) query.append('page', params.page);
        if (params.limit != null) query.append('limit', params.limit);
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);
        if (params.search) query.append('search', params.search);
        if (params.status) query.append('status', params.status);
        if (params.dateFrom) query.append('dateFrom', params.dateFrom);
        if (params.dateTo) query.append('dateTo', params.dateTo);
        const url = query.toString() ? `/orders?${query.toString()}` : '/orders';
        const response = await axiosInstance.get(url);
        const payload = response.data.total !== undefined
            ? { data: response.data.data || [], total: response.data.total, page: response.data.page, limit: response.data.limit, totalPages: response.data.totalPages }
            : { data: response.data.data || response.data || [], total: (response.data.data || response.data || []).length, page: 1, limit: 10, totalPages: 1 };
        dispatch({ type: ORDER_LIST, payload });
        return payload;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage || 'Failed to load orders');
        return false;
    } finally {
        dispatch({ type: ORDER_LOADING, payload: false });
    }
};

/**
 * Fetch customers (users who have orders) for dropdown filter. Supports search and pagination.
 * @param {Object} params - { search, page, limit }
 * @returns {Object} - { data, total, page, limit, totalPages } or { data: [], ... } on error
 */
export const fetchOrderCustomers = (params = {}) => async () => {
    try {
        const query = new URLSearchParams();
        if (params.search != null && params.search !== '') query.append('search', params.search);
        if (params.page != null) query.append('page', params.page);
        if (params.limit != null) query.append('limit', params.limit);
        const url = `/orders/customers/list?${query.toString()}`;
        const response = await axiosInstance.get(url);
        const res = response.data;
        return {
            success: res.success,
            data: res.data || [],
            total: res.total ?? 0,
            page: res.page ?? 1,
            limit: res.limit ?? 20,
            totalPages: res.totalPages ?? 1,
        };
    } catch (error) {
        console.error('Error fetching order customers:', error);
        return { success: false, data: [], total: 0, page: 1, limit: 20, totalPages: 1 };
    }
};

// Delete single order
export const orderDelete = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/orders/delete/${id}`);
        return true;
    } catch (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
};

// Delete all orders (admin only)
export const orderDeleteAll = () => async (dispatch) => {
    try {
        const response = await axiosInstance.delete('/orders/delete-all');
        const deleted = response?.data?.deleted ?? 0;
        if (deleted > 0) {
            toast.success(response?.data?.message || `Deleted ${deleted} order(s) successfully.`);
        } else {
            toast.info(response?.data?.message || 'No orders to delete.');
        }
        return { success: true, deleted };
    } catch (error) {
        const msg = error?.response?.data?.message;
        toast.error(msg || 'Failed to delete all orders');
        throw error;
    }
};

export const updateOrderStatus = (id, status) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/orders/item/status/${id}`, { status });
      
        return response.data;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};










