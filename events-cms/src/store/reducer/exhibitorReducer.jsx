import { CREATE_EXHIBITOR, DELETE_EXHIBITOR, EXHIBITOR_BY_ID, EXHIBITOR_LIST, UPDATE_EXHIBITOR } from "../constants/actionTypes";

const initialState = {
    exhibitors: [],
    exhibitorById: null,
    loading: false,
    error: null,
    total: 0
};

const exhibitorReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case EXHIBITOR_LIST:
            return {
                ...state,
                exhibitors: payload.data || [],
                total: payload.metadata?.total || 0,
                loading: false,
                error: null
            };
        case EXHIBITOR_BY_ID:
            return {
                ...state,
                exhibitorById: payload,
                loading: false,
                error: null
            };
        case CREATE_EXHIBITOR:
            return {
                ...state,
                exhibitors: [payload, ...state.exhibitors],
                loading: false,
                error: null
            };
        case UPDATE_EXHIBITOR:
            return {
                ...state,
                exhibitors: state.exhibitors.map(exhibitor => 
                    exhibitor.id === payload.id ? payload : exhibitor
                ),
                exhibitorById: state.exhibitorById?.id === payload.id ? payload : state.exhibitorById,
                loading: false,
                error: null
            };
        case DELETE_EXHIBITOR:
            return {
                ...state,
                exhibitors: state.exhibitors.filter(exhibitor => exhibitor.id !== payload),
                loading: false,
                error: null
            };
        default:
            return state;
    }
};

export default exhibitorReducer;