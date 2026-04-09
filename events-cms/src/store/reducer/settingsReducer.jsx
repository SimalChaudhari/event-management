import { TERMS_CONDITIONS, PRIVACY_POLICY, LOGO_GET, LOGO_UPDATE, LOGO_DELETE, LOGO_LOADING, LOGO_ERROR, CLEAR_LOGO_ERROR } from "../constants/actionTypes";

const initialState = {
    termsConditions: null,
    privacyPolicy: null,
    logo: null,
    logoLoading: false,
    logoError: null,
};

const settingsReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case TERMS_CONDITIONS:
            return {
                ...state,
                termsConditions: payload,
            };
        case PRIVACY_POLICY:
            return {
                ...state,
                privacyPolicy: payload,
            };
        case LOGO_GET:
            return {
                ...state,
                logo: payload,
                logoError: null,
            };
        case LOGO_UPDATE:
            return {
                ...state,
                logo: payload,
                logoError: null,
            };
        case LOGO_DELETE:
            return {
                ...state,
                logo: null,
                logoError: null,
            };
        case LOGO_LOADING:
            return {
                ...state,
                logoLoading: payload,
            };
        case LOGO_ERROR:
            return {
                ...state,
                logoError: payload,
            };
        case CLEAR_LOGO_ERROR:
            return {
                ...state,
                logoError: null,
            };
        default:
            return state;
    }
};

export default settingsReducer; 