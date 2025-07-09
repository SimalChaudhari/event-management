import { 
    GET_BANNERS, 
    GET_BANNER_EVENTS, 
    UPLOAD_BANNERS, 
    UPLOAD_BANNER_EVENTS,
    DELETE_BANNER_IMAGE,
    DELETE_BANNER_EVENT_IMAGE,
    CLEAR_ALL_BANNERS,
    CLEAR_ALL_BANNER_EVENTS,
    SET_BANNER_LOADING,
    SET_BANNER_ERROR
} from "../constants/actionTypes";

const initialState = {
    banners: null,
    bannerEvents: null,
    loading: false,
    error: null,
};

const bannerReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case GET_BANNERS:
            return {
                ...state,
                banners: payload,
                error: null,
            };
        case GET_BANNER_EVENTS:
            return {
                ...state,
                bannerEvents: payload,
                error: null,
            };
        case UPLOAD_BANNERS:
            return {
                ...state,
                banners: payload,
                error: null,
            };
        case UPLOAD_BANNER_EVENTS:
            return {
                ...state,
                bannerEvents: payload,
                error: null,
            };
        case DELETE_BANNER_IMAGE:
            return {
                ...state,
                banners: payload,
                error: null,
            };
        case DELETE_BANNER_EVENT_IMAGE:
            return {
                ...state,
                bannerEvents: payload,
                error: null,
            };
        case CLEAR_ALL_BANNERS:
            return {
                ...state,
                banners: null,
                error: null,
            };
        case CLEAR_ALL_BANNER_EVENTS:
            return {
                ...state,
                bannerEvents: null,
                error: null,
            };
        case SET_BANNER_LOADING:
            return {
                ...state,
                loading: payload,
            };
        case SET_BANNER_ERROR:
            return {
                ...state,
                error: payload,
            };
        default:
            return state;
    }
};

export default bannerReducer; 