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
} from "../constants/actionTypes";

const initialState = {
    exhibitors: [],
    exhibitorById: null,
    promotionalOffers: [],
    loading: false,
    error: null,
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

        case FETCH_PROMOTIONAL_OFFERS:
            return {
                ...state,
                promotionalOffers: payload,
                loading: false,
                error: null
            };

        case CREATE_PROMOTIONAL_OFFER:
            return {
                ...state,
                promotionalOffers: [payload, ...state.promotionalOffers],
                loading: false,
                error: null
            };

        case UPDATE_PROMOTIONAL_OFFER:
            return {
                ...state,
                promotionalOffers: state.promotionalOffers.map(offer => 
                    offer.id === payload.id ? payload : offer
                ),
                loading: false,
                error: null
            };

        case DELETE_PROMOTIONAL_OFFER:
            return {
                ...state,
                promotionalOffers: state.promotionalOffers.filter(offer => offer.id !== payload),
                loading: false,
                error: null
            };

        case GET_PROMOTIONAL_OFFERS_BY_EXHIBITOR:
            return {
                ...state,
                promotionalOffers: payload.data?.data || [],
                loading: false,
                error: null
            };

        case ALL_PROMOTIONAL_OFFERS:
            return {
                ...state,
                allPromotionalOffers: payload,
                loading: false,
                error: null
            };

        case PROMOTIONAL_OFFER_BY_ID:
            return {
                ...state,
                promotionalOfferById: payload,
                loading: false,
                error: null
            };

        default:
            return state;
    }
};

export default exhibitorReducer;