import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import {
    COUPON_LIST,
    COUPON_BY_ID,
    CREATE_COUPON,
    UPDATE_COUPON,
    DELETE_COUPON,
    COUPON_LOADING
} from '../constants/actionTypes';

const setCouponLoading = (dispatch, loading) => {
    dispatch({
        type: COUPON_LOADING,
        payload: loading
    });
};

/** Get all coupons (admin gets full list) */
export const getCoupons = () => async (dispatch) => {
    try {
        setCouponLoading(dispatch, true);
        const response = await axiosInstance.get('/coupons');
        const raw = response.data;
        const data = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        dispatch({
            type: COUPON_LIST,
            payload: data
        });
        return { success: true, data };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch coupons';
        toast.error(errorMessage);
        return { success: false, data: [] };
    } finally {
        setCouponLoading(dispatch, false);
    }
};

/** Get coupon by id and store in Redux */
export const couponById = (id) => async (dispatch) => {
    try {
        setCouponLoading(dispatch, true);
        const response = await axiosInstance.get(`/coupons/${id}`);
        const data = response.data?.data ?? response.data;
        dispatch({
            type: COUPON_BY_ID,
            payload: data
        });
        return data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch coupon';
        toast.error(errorMessage);
        throw error;
    } finally {
        setCouponLoading(dispatch, false);
    }
};

/** Create coupon */
export const createCoupon = (data) => async (dispatch) => {
    try {
        setCouponLoading(dispatch, true);
        const response = await axiosInstance.post('/coupons/create', data);
        if (response && response.data) {
            toast.success('Coupon created successfully');
            const created = response.data;
            if (created?.id) {
                dispatch({
                    type: CREATE_COUPON,
                    payload: created
                });
            }
            return { success: true, data: created };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create coupon';
        toast.error(errorMessage);
        return { success: false };
    } finally {
        setCouponLoading(dispatch, false);
    }
};

/** Update coupon */
export const updateCoupon = (id, data) => async (dispatch) => {
    try {
        setCouponLoading(dispatch, true);
        const response = await axiosInstance.put(`/coupons/update/${id}`, data);
        if (response && response.data) {
            toast.success('Coupon updated successfully');
            const updated = response.data;
            const payload = updated?.id ? updated : { ...updated, id };
            dispatch({
                type: UPDATE_COUPON,
                payload
            });
            return { success: true, data: payload };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update coupon';
        toast.error(errorMessage);
        return { success: false };
    } finally {
        setCouponLoading(dispatch, false);
    }
};

/** Delete coupon */
export const deleteCoupon = (id) => async (dispatch) => {
    try {
        setCouponLoading(dispatch, true);
        await axiosInstance.delete(`/coupons/delete/${id}`);
        toast.success('Coupon deleted successfully');
        dispatch({
            type: DELETE_COUPON,
            payload: id
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete coupon';
        toast.error(errorMessage);
        return false;
    } finally {
        setCouponLoading(dispatch, false);
    }
};
