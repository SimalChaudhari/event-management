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
            // Only update if payload is valid and has an id
            if (!payload || !payload.id) {
                return state;
            }
            // Convert ids to strings for consistent comparison
            const updateId = String(payload.id);
            // Check if user exists in the list
            const userIndex = state.user.findIndex(u => String(u.id) === updateId);
            if (userIndex === -1) {
                // User doesn't exist, add it instead
                return {
                    ...state,
                    user: [payload, ...state.user],
                    loading: false
                };
            }
            // Update the existing user
            return {
                ...state,
                user: state.user.map((user) => (String(user.id) === updateId ? payload : user)),
                loading: false
            };

        case DELETE_USER:
            // Only delete if payload (id) is valid
            if (!payload) {
                return state;
            }
            // Convert id to string for consistent comparison
            const deleteId = String(payload);
            return {
                ...state,
                user: state.user.filter((user) => String(user.id) !== deleteId),
                loading: false
            };

        default:
            return state;
    }
};

export default userReducer;
