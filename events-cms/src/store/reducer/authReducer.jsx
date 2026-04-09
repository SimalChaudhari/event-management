import { AUTH_DATA, AUTH_LOADING } from '../constants/actionTypes';

const initialState = {
    authenticated: false,
    authUser: null,
    loading: true // Changed to false as global loading will handle this
};

const authReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case AUTH_DATA:
            return {
                ...state,
                authenticated: true,
                authUser: payload.user,
                loading: false // Always set to false after successful auth
            };

        case 'LOGOUT':
            return {
                ...initialState,
                loading: false
            };

        case AUTH_LOADING:
            return {
                ...state,
                loading: payload
            };

        default:
            return state;
    }
};

export default authReducer;
