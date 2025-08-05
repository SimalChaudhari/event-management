import { USER_LIST, USER_LOADING, USER_ERROR, CREATE_USER, UPDATE_USER, DELETE_USER, USER_BY_ID } from '../constants/actionTypes';

const initialState = {
    user: [],
    userByID: '',
    loading: false
};

const userReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case USER_LOADING:
            return {
                ...state,
                loading: payload
            };

        case USER_ERROR:
            return {
                ...state,
                loading: false,
                error: payload
            };

        case USER_LIST:
            return {
                ...state,
                user: payload,
                loading: false
            };

        case USER_BY_ID:
            return {
                ...state,
                userByID: payload,
                loading: false
            };

        case CREATE_USER:
            return {
                ...state,
                user: [...state.user, payload],
                loading: false
            };

        case UPDATE_USER:
            return {
                ...state,
                user: state.user.map((user) => (user.id === payload.id ? payload : user)),
                loading: false
            };

        case DELETE_USER:
            return {
                ...state,
                user: state.user.filter((user) => user.id !== payload),
                loading: false
            };

        default:
            return state;
    }
};

export default userReducer;
