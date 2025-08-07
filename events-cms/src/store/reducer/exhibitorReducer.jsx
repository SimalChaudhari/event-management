import {
    ALL_PROMOTIONAL_OFFERS,
    CREATE_EXHIBITOR,
    CREATE_PROMOTIONAL_OFFER,
    DELETE_EXHIBITOR,
    DELETE_PROMOTIONAL_OFFER,
    EXHIBITOR_BY_ID,
    EXHIBITOR_LIST,
    EXHIBITOR_LOADING,
    EXHIBITOR_ERROR,
    FETCH_PROMOTIONAL_OFFERS,
    GET_PROMOTIONAL_OFFERS_BY_EXHIBITOR,
    PROMOTIONAL_OFFER_BY_ID,
    UPDATE_EXHIBITOR,
    UPDATE_PROMOTIONAL_OFFER
} from '../constants/actionTypes';

const initialState = {
    exhibitors: [],
    exhibitorById: null,
    promotionalOffers: [],
    promotionalOfferById: null,
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
            return {
                ...state,
                exhibitors: [...state.exhibitors, payload],
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

        //Promotional Offer

        case FETCH_PROMOTIONAL_OFFERS:
            return {
                ...state,
                promotionalOffers: payload,
                loading: false,
                
            };

        case CREATE_PROMOTIONAL_OFFER:
            return {
                ...state,
                promotionalOffers: [...state.promotionalOffers, payload],
                loading: false,

            };

        case UPDATE_PROMOTIONAL_OFFER:
            return {
                ...state,
                promotionalOffers: state.promotionalOffers.map((offer) => (offer.id === payload.id ? payload : offer)),
                loading: false,
                
            };

        case DELETE_PROMOTIONAL_OFFER:
            return {
                ...state,
                promotionalOffers: state.promotionalOffers.filter((offer) => offer.id !== payload),
                loading: false,
                
            };

        case GET_PROMOTIONAL_OFFERS_BY_EXHIBITOR:
            return {
                ...state,
                promotionalOffers: payload.data?.data || [],
                loading: false,
                
            };

        case ALL_PROMOTIONAL_OFFERS:
            return {
                ...state,
                allPromotionalOffers: payload,
                loading: false,
                
            };

        case PROMOTIONAL_OFFER_BY_ID:
            return {
                ...state,
                promotionalOfferById: payload,
                loading: false,
                
            };

        default:
            return state;
    }
};

export default exhibitorReducer;
