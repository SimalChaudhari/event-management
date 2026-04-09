import { CATEGORY_LIST, CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY, CATEGORY_LOADING } from "../constants/actionTypes";

const initialState = {
    categories: [],
    pagination: {},
    loading: false,
    error: null
};

const categoryReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case CATEGORY_LOADING:
            return {
                ...state,
                loading: payload
            };
        case CATEGORY_LIST:
            // Handle payload as an object with data and pagination
            return {
                ...state,
                categories: payload.data || payload, // Support both old format (array) and new format (object)
                pagination: payload.pagination || {},
                loading: false,
                error: null
            };
        case CREATE_CATEGORY:
            // Only add if payload is valid
            if (!payload) {
                return state;
            }
            // Check if category already exists (by id) to avoid duplicates
            // Only check if payload has an id
            if (payload.id) {
                const categoryExists = state.categories.some(cat => cat.id === payload.id);
                if (categoryExists) {
                    return state;
                }
            }
            return {
                ...state,
                categories: [payload, ...state.categories],
                loading: false,
                error: null
            };
        case UPDATE_CATEGORY:
            // Only update if payload is valid and has an id
            if (!payload || !payload.id) {
                return state;
            }
            // Check if category exists in the list
            const categoryIndex = state.categories.findIndex(cat => cat.id === payload.id);
            if (categoryIndex === -1) {
                // Category doesn't exist, add it instead
                return {
                    ...state,
                    categories: [payload, ...state.categories],
                    loading: false,
                    error: null
                };
            }
            // Update the existing category
            return {
                ...state,
                categories: state.categories.map(category => 
                    category.id === payload.id ? payload : category
                ),
                loading: false,
                error: null
            };
        case DELETE_CATEGORY:
            return {
                ...state,
                categories: state.categories.filter(category => category.id !== payload),
                loading: false,
                error: null
            };
        default:
            return state;
    }
};

export default categoryReducer; 