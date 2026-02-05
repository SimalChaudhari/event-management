import { COUPON_LIST, COUPON_BY_ID, CREATE_COUPON, UPDATE_COUPON, DELETE_COUPON, COUPON_LOADING } from '../constants/actionTypes';

const initialState = {
    coupons: [],
    couponByID: null,
    loading: false,
    error: null
};

const couponReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case COUPON_LOADING:
            return {
                ...state,
                loading: payload
            };
        case COUPON_LIST:
            return {
                ...state,
                coupons: Array.isArray(payload) ? payload : [],
                loading: false,
                error: null
            };
        case COUPON_BY_ID:
            return {
                ...state,
                couponByID: payload,
                loading: false,
                error: null
            };
        case CREATE_COUPON:
            if (!payload || !payload.id) return state;
            const existsCreate = state.coupons.some((c) => c.id === payload.id);
            if (existsCreate) return state;
            return {
                ...state,
                coupons: [payload, ...state.coupons],
                loading: false,
                error: null
            };
        case UPDATE_COUPON:
            if (!payload || !payload.id) return state;
            return {
                ...state,
                coupons: state.coupons.map((c) => (c.id === payload.id ? payload : c)),
                couponByID: state.couponByID?.id === payload.id ? payload : state.couponByID,
                loading: false,
                error: null
            };
        case DELETE_COUPON:
            return {
                ...state,
                coupons: state.coupons.filter((c) => c.id !== payload),
                couponByID: state.couponByID?.id === payload ? null : state.couponByID,
                loading: false,
                error: null
            };
        default:
            return state;
    }
};

export default couponReducer;
