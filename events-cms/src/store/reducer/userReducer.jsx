import { USER_LIST, USER_LOADING, USER_ERROR, CREATE_USER, UPDATE_USER, DELETE_USER, USER_BY_ID } from '../constants/actionTypes';

const initialState = {
    user: [],
    userByID: '',
    pagination: {},
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
            // Handle both old format (array) and new format (object with data and pagination)
            if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.data) {
                // Filter out any undefined/null entries
                const validUsers = (payload.data || []).filter(u => u && u.id !== undefined && u.id !== null);
                return {
                    ...state,
                    user: validUsers,
                    pagination: payload.pagination,
                    loading: false
                };
            }
            // Backward compatibility: if payload is array, store it directly
            // Filter out any undefined/null entries
            const validUsersList = Array.isArray(payload) 
                ? payload.filter(u => u && u.id !== undefined && u.id !== null)
                : [];
            return {
                ...state,
                user: validUsersList,
                pagination: {},
                loading: false
            };

        case USER_BY_ID:
            return {
                ...state,
                userByID: payload,
                loading: false
            };

        case CREATE_USER:
            // Ensure payload is valid before adding
            if (!payload || !payload.id) {
                return state;
            }
            // Filter out any undefined/null values from existing users
            const validUsersForCreate = (state.user || []).filter(u => u && u.id !== undefined && u.id !== null);
            return {
                ...state,
                user: [...validUsersForCreate, payload],
                loading: false
            };

        case UPDATE_USER:
            // Only update if payload is valid and has an id
            if (!payload || !payload.id) {
                return state;
            }
            // Ensure user array exists and filter out any undefined/null values
            const validUsers = (state.user || []).filter(u => u && u.id !== undefined && u.id !== null);
            // Convert ids to strings for consistent comparison
            const updateId = String(payload.id);
            // Check if user exists in the list
            const userIndex = validUsers.findIndex(u => u && String(u.id) === updateId);
            if (userIndex === -1) {
                // User doesn't exist, add it instead
                return {
                    ...state,
                    user: [payload, ...validUsers],
                    loading: false
                };
            }
            // Update the existing user
            return {
                ...state,
                user: validUsers.map((user) => (user && String(user.id) === updateId ? payload : user)),
                loading: false
            };

        case DELETE_USER:
            // Only delete if payload (id) is valid
            if (!payload) {
                return state;
            }
            // Ensure user array exists and filter out any undefined/null values
            const validUsersForDelete = (state.user || []).filter(u => u && u.id !== undefined && u.id !== null);
            // Convert id to string for consistent comparison
            const deleteId = String(payload);
            return {
                ...state,
                user: validUsersForDelete.filter((user) => user && String(user.id) !== deleteId),
                loading: false
            };

        default:
            return state;
    }
};

export default userReducer;
