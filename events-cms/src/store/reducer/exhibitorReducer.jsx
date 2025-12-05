import {
    CREATE_EXHIBITOR,
    DELETE_EXHIBITOR,
    EXHIBITOR_BY_ID,
    EXHIBITOR_LIST,
    EXHIBITOR_LOADING,
    EXHIBITOR_ERROR,
    UPDATE_EXHIBITOR
} from '../constants/actionTypes';

const initialState = {
    exhibitors: [],
    exhibitorById: null,
    loading: false,
    total: 0
};

const exhibitorReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case EXHIBITOR_LOADING:
            return {
                ...state,
                loading: payload
            };

        case EXHIBITOR_ERROR:
            return {
                ...state,
                loading: false,
                error: payload
            };

        case EXHIBITOR_LIST:
            return {
                ...state,
                exhibitors: payload.data || [],
                total: payload.metadata?.total || 0,
                loading: false,
                
            };

        case EXHIBITOR_BY_ID:
            return {
                ...state,
                exhibitorById: payload,
                loading: false,
                
            };

        case CREATE_EXHIBITOR:
            // Add new exhibitor to the exhibitors list (at the beginning like events)
            const newExhibitor = payload;
            const currentExhibitors = state.exhibitors || [];
            return {
                ...state,
                exhibitors: [newExhibitor, ...currentExhibitors],
                loading: false,
                
            };

        case UPDATE_EXHIBITOR:
            return {
                ...state,
                exhibitors: state.exhibitors.map((exhibitor) => (exhibitor.id === payload.id ? payload : exhibitor)),
                exhibitorById: state.exhibitorById?.id === payload.id ? payload : state.exhibitorById,
                loading: false,
             };

        case DELETE_EXHIBITOR:
            return {
                ...state,
                exhibitors: state.exhibitors.filter((exhibitor) => exhibitor.id !== payload),
                loading: false,
                
            };

        default:
            return state;
    }
};

export default exhibitorReducer;
