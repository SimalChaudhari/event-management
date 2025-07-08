import { TERMS_CONDITIONS, PRIVACY_POLICY } from "../constants/actionTypes";

const initialState = {
    termsConditions: null,
    privacyPolicy: null,
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
        default:
            return state;
    }
};

export default settingsReducer; 