import { CATEGORY_LIST, CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } from "../constants/actionTypes";

const initialState = {
    categories: [],
    loading: false,
    error: null
};

const categoryReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case CATEGORY_LIST:
            return {
                ...state,
                categories: payload,
                loading: false,
                error: null
            };
        case CREATE_CATEGORY:
            return {
                ...state,
                categories: [payload, ...state.categories],
                loading: false,
                error: null
            };
        case UPDATE_CATEGORY:
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