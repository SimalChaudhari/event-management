import {
    PUSH_NOTIFICATION_SET_LOADING,
    PUSH_NOTIFICATION_SET_ERROR,
    PUSH_NOTIFICATION_LIST_SUCCESS,
    PUSH_NOTIFICATION_DETAIL_SUCCESS,
    PUSH_NOTIFICATION_CREATE_SUCCESS,
    PUSH_NOTIFICATION_UPDATE_SUCCESS,
    PUSH_NOTIFICATION_DELETE_SUCCESS,
    PUSH_NOTIFICATION_CLEAR_DETAIL
} from '../actions/pushNotificationActions.jsx';

const initialState = {
    notifications: [],
    selectedNotification: null,
    loading: false,
    error: null
};

const upsertNotification = (notifications, updatedNotification) => {
    if (!updatedNotification?.id) {
        return notifications;
    }

    const index = notifications.findIndex((item) => item.id === updatedNotification.id);

    if (index === -1) {
        return [updatedNotification, ...notifications];
    }

    const next = [...notifications];
    next[index] = {
        ...next[index],
        ...updatedNotification
    };
    return next;
};

const pushNotificationReducer = (state = initialState, action) => {
    switch (action.type) {
        case PUSH_NOTIFICATION_SET_LOADING:
            return {
                ...state,
                loading: action.payload
            };

        case PUSH_NOTIFICATION_SET_ERROR:
            return {
                ...state,
                error: action.payload
            };

        case PUSH_NOTIFICATION_LIST_SUCCESS:
            return {
                ...state,
                notifications: action.payload,
                error: null
            };

        case PUSH_NOTIFICATION_DETAIL_SUCCESS:
            return {
                ...state,
                selectedNotification: action.payload,
                error: null
            };

        case PUSH_NOTIFICATION_CREATE_SUCCESS:
        case PUSH_NOTIFICATION_UPDATE_SUCCESS:
            return {
                ...state,
                notifications: upsertNotification(state.notifications, action.payload),
                selectedNotification:
                    state.selectedNotification?.id === action.payload?.id
                        ? { ...state.selectedNotification, ...action.payload }
                        : state.selectedNotification,
                error: null
            };

        case PUSH_NOTIFICATION_DELETE_SUCCESS:
            return {
                ...state,
                notifications: state.notifications.filter((item) => item.id !== action.payload),
                selectedNotification:
                    state.selectedNotification?.id === action.payload
                        ? null
                        : state.selectedNotification,
                error: null
            };

        case PUSH_NOTIFICATION_CLEAR_DETAIL:
            return {
                ...state,
                selectedNotification: null,
                error: null
            };

        default:
            return state;
    }
};

export default pushNotificationReducer;


