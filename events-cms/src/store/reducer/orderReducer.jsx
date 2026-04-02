import { ORDER_LIST, ORDER_LOADING } from "../constants/actionTypes";

const initialState = {
    order: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
    },
    orderByID: '',
    loading: false,
};

const orderReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case ORDER_LIST:
            return {
                ...state,
                order: typeof payload === 'object' && payload !== null && Array.isArray(payload.data)
                    ? { data: payload.data, total: payload.total ?? 0, page: payload.page ?? 1, limit: payload.limit ?? 10, totalPages: payload.totalPages ?? 1 }
                    : { ...state.order, data: Array.isArray(payload) ? payload : [] },
            };
        case ORDER_LOADING:
            return { ...state, loading: !!payload };
        default:
            return state;
    }
};
export default orderReducer;
