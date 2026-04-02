import { 
    USER_ERROR,
    AUTH_ERROR,
    EVENT_ERROR, 
    ORDER_ERROR, 
    SPEAKER_ERROR,
    EXHIBITOR_ERROR,
    BANNER_ERROR,
    GALLERY_ERROR,
    CATEGORY_ERROR,
    SETTINGS_ERROR,
    WITHDRAW_ERROR
} from '../constants/actionTypes';

const initialState = {
    user: null,
    auth: null,
    event: null,
    order: null,
    speaker: null,
    exhibitor: null,
    banner: null,
    gallery: null,
    category: null,
    settings: null,
    withdraw: null,
    global: null
};

const errorReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case USER_ERROR:
            return {
                ...state,
                user: payload,
                global: payload || state.global
            };
        case AUTH_ERROR:
            return {
                ...state,
                auth: payload,
                global: payload || state.global
            };
        case EVENT_ERROR:
            return {
                ...state,
                event: payload,
                global: payload || state.global
            };
        case ORDER_ERROR:
            return {
                ...state,
                order: payload,
                global: payload || state.global
            };
        case SPEAKER_ERROR:
            return {
                ...state,
                speaker: payload,
                global: payload || state.global
            };
        case EXHIBITOR_ERROR:
            return {
                ...state,
                exhibitor: payload,
                global: payload || state.global
            };
        case BANNER_ERROR:
            return {
                ...state,
                banner: payload,
                global: payload || state.global
            };
        case GALLERY_ERROR:
            return {
                ...state,
                gallery: payload,
                global: payload || state.global
            };
        case CATEGORY_ERROR:
            return {
                ...state,
                category: payload,
                global: payload || state.global
            };
        case SETTINGS_ERROR:
            return {
                ...state,
                settings: payload,
                global: payload || state.global
            };
        case WITHDRAW_ERROR:
            return {
                ...state,
                withdraw: payload,
                global: payload || state.global
            };
        default:
            return state;
    }
};

export default errorReducer; 