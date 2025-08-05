import { 
    USER_LOADING, 
    EVENT_LOADING, 
    ORDER_LOADING, 
    SPEAKER_LOADING,
    EXHIBITOR_LOADING,
    BANNER_LOADING,
    GALLERY_LOADING,
    CATEGORY_LOADING,
    SETTINGS_LOADING,
    WITHDRAW_LOADING,
    AUTH_LOADING,
    PROMOTIONAL_OFFER_LOADING
} from '../constants/actionTypes';

const initialState = {
    user: false,
    event: false,
    order: false,
    speaker: false,
    exhibitor: false,
    banner: false,
    gallery: false,
    category: false,
    settings: false,
    withdraw: false,
    auth: false,
    global: false
};

const loadingReducer = (state = initialState, { type, payload } = {}) => {
    let newState;
    
    switch (type) {
        case USER_LOADING:
            newState = {
                ...state,
                user: payload
            };
            break;
        
        case EVENT_LOADING:
            newState = {
                ...state,
                event: payload
            };
            break;
        
        case ORDER_LOADING:
            newState = {
                ...state,
                order: payload
            };
            break;
        
        case SPEAKER_LOADING:
            newState = {
                ...state,
                speaker: payload
            };
            break;
        
        case EXHIBITOR_LOADING:
            newState = {
                ...state,
                exhibitor: payload
            };
            break;

        case PROMOTIONAL_OFFER_LOADING:
            newState = {
                ...state,
                promotionalOffer: payload
            };
            break;
        
        case BANNER_LOADING:
            newState = {
                ...state,
                banner: payload
            };
            break;
        
        case GALLERY_LOADING:
            newState = {
                ...state,
                gallery: payload
            };
            break;
        
        case CATEGORY_LOADING:
            newState = {
                ...state,
                category: payload
            };
            break;
        
        case SETTINGS_LOADING:
            newState = {
                ...state,
                settings: payload
            };
            break;
        
        case WITHDRAW_LOADING:
            newState = {
                ...state,
                withdraw: payload
            };
            break;
        
        case AUTH_LOADING:
            newState = {
                ...state,
                auth: payload
            };
            break;
        
        default:
            return state;
    }
    
    // Calculate global loading state - true if any individual loading is true
    const { user, event, order, speaker, exhibitor, banner, gallery, category, settings, withdraw, auth } = newState;
    newState.global = user || event || order || speaker || exhibitor || banner || gallery || category || settings || withdraw || auth;
    
    return newState;
};

export default loadingReducer; 