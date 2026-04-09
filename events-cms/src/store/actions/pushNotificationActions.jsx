import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { PUSH_NOTIFICATION_LOADING } from '../constants/actionTypes';

// Action Types
export const PUSH_NOTIFICATION_SET_LOADING = 'PUSH_NOTIFICATION_SET_LOADING';
export const PUSH_NOTIFICATION_SET_ERROR = 'PUSH_NOTIFICATION_SET_ERROR';

export const PUSH_NOTIFICATION_LIST_SUCCESS = 'PUSH_NOTIFICATION_LIST_SUCCESS';
export const PUSH_NOTIFICATION_DETAIL_SUCCESS = 'PUSH_NOTIFICATION_DETAIL_SUCCESS';
export const PUSH_NOTIFICATION_CREATE_SUCCESS = 'PUSH_NOTIFICATION_CREATE_SUCCESS';
export const PUSH_NOTIFICATION_UPDATE_SUCCESS = 'PUSH_NOTIFICATION_UPDATE_SUCCESS';
export const PUSH_NOTIFICATION_DELETE_SUCCESS = 'PUSH_NOTIFICATION_DELETE_SUCCESS';
export const PUSH_NOTIFICATION_CLEAR_DETAIL = 'PUSH_NOTIFICATION_CLEAR_DETAIL';

// Helpers
const getErrorMessage = (error, fallbackMessage) =>
    error?.response?.data?.message || error?.message || fallbackMessage;

export const setPushNotificationLoading = (loading) => ({
    type: PUSH_NOTIFICATION_SET_LOADING,
    payload: loading
});

export const setPushNotificationError = (error) => ({
    type: PUSH_NOTIFICATION_SET_ERROR,
    payload: error
});

const setPushNotificationGlobalLoading = (dispatch, loading) => {
    dispatch({
        type: PUSH_NOTIFICATION_LOADING,
        payload: loading
    });
};

export const clearPushNotificationDetail = () => ({
    type: PUSH_NOTIFICATION_CLEAR_DETAIL
});

// Fetch list
export const fetchPushNotifications = (filters = {}) => async (dispatch) => {
    try {
        dispatch(setPushNotificationLoading(true));
        setPushNotificationGlobalLoading(dispatch, true);

        const response = await axiosInstance.get('/scheduled-push-notifications', {
            params: filters
        });

        const data = response?.data?.data ?? response?.data ?? [];

        dispatch({
            type: PUSH_NOTIFICATION_LIST_SUCCESS,
            payload: Array.isArray(data) ? data : []
        });

        return true;
    } catch (error) {
        const errorMessage = getErrorMessage(
            error,
            'Failed to fetch push notifications'
        );

        dispatch(setPushNotificationError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setPushNotificationLoading(false));
        setPushNotificationGlobalLoading(dispatch, false);
    }

    return false;
};

// Fetch single notification
export const fetchPushNotificationDetail = (notificationId) => async (dispatch) => {
    if (!notificationId) return false;

    try {
        dispatch(setPushNotificationLoading(true));
        setPushNotificationGlobalLoading(dispatch, true);

        const response = await axiosInstance.get(
            `/scheduled-push-notifications/${notificationId}`
        );

        const data = response?.data?.data ?? response?.data;

        dispatch({
            type: PUSH_NOTIFICATION_DETAIL_SUCCESS,
            payload: data ?? null
        });

        return data;
    } catch (error) {
        const errorMessage = getErrorMessage(
            error,
            'Failed to fetch notification details'
        );

        dispatch(setPushNotificationError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setPushNotificationLoading(false));
        setPushNotificationGlobalLoading(dispatch, false);
    }

    return null;
};

// Create
export const createPushNotification = (payload) => async (dispatch) => {
    try {
        dispatch(setPushNotificationLoading(true));
        setPushNotificationGlobalLoading(dispatch, true);

        const response = await axiosInstance.post(
            '/scheduled-push-notifications',
            payload
        );

        const data = response?.data?.data ?? response?.data;

        dispatch({
            type: PUSH_NOTIFICATION_CREATE_SUCCESS,
            payload: data
        });

        toast.success(
            response?.data?.message || 'Push notification created successfully'
        );

        return { success: true, data };
    } catch (error) {
        const errorMessage = getErrorMessage(
            error,
            'Failed to create push notification'
        );

        dispatch(setPushNotificationError(errorMessage));
        toast.error(errorMessage);

        return { success: false, error: errorMessage };
    } finally {
        dispatch(setPushNotificationLoading(false));
        setPushNotificationGlobalLoading(dispatch, false);
    }
};

// Update
export const updatePushNotification = (notificationId, payload) => async (dispatch) => {
    if (!notificationId) return { success: false, error: 'Invalid notification' };

    try {
        dispatch(setPushNotificationLoading(true));
        setPushNotificationGlobalLoading(dispatch, true);

        const response = await axiosInstance.put(
            `/scheduled-push-notifications/${notificationId}`,
            payload
        );

        const data = response?.data?.data ?? response?.data;

        dispatch({
            type: PUSH_NOTIFICATION_UPDATE_SUCCESS,
            payload: data
        });

        toast.success(
            response?.data?.message || 'Push notification updated successfully'
        );

        return { success: true, data };
    } catch (error) {
        const errorMessage = getErrorMessage(
            error,
            'Failed to update push notification'
        );

        dispatch(setPushNotificationError(errorMessage));
        toast.error(errorMessage);

        return { success: false, error: errorMessage };
    } finally {
        dispatch(setPushNotificationLoading(false));
        setPushNotificationGlobalLoading(dispatch, false);
    }
};

// Delete
export const deletePushNotification = (notificationId) => async (dispatch) => {
    if (!notificationId) return false;

    try {
        dispatch(setPushNotificationLoading(true));
        setPushNotificationGlobalLoading(dispatch, true);

        const response = await axiosInstance.delete(
            `/scheduled-push-notifications/${notificationId}`
        );

        dispatch({
            type: PUSH_NOTIFICATION_DELETE_SUCCESS,
            payload: notificationId
        });

        toast.success(
            response?.data?.message || 'Push notification deleted successfully'
        );

        return true;
    } catch (error) {
        const errorMessage = getErrorMessage(
            error,
            'Failed to delete push notification'
        );

        dispatch(setPushNotificationError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setPushNotificationLoading(false));
        setPushNotificationGlobalLoading(dispatch, false);
    }

    return false;
};

// Trigger send immediately
export const sendPushNotificationNow = (notificationId) => async (dispatch) => {
    if (!notificationId) return { success: false, error: 'Invalid notification' };

    try {
        setPushNotificationGlobalLoading(dispatch, true);
        const response = await axiosInstance.post(
            `/scheduled-push-notifications/${notificationId}/send`
        );

        toast.success(
            response?.data?.message || 'Notification queued for sending'
        );

        // Refresh list to reflect updated status counts
        await dispatch(fetchPushNotifications());

        return { success: true };
    } catch (error) {
        const errorMessage = getErrorMessage(
            error,
            'Failed to send notification'
        );

        toast.error(errorMessage);

        return { success: false, error: errorMessage };
    } finally {
        setPushNotificationGlobalLoading(dispatch, false);
    }
};


