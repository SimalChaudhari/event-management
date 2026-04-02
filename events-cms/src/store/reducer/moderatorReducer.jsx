import {
    MODERATOR_LOADING,
    MODERATOR_ERROR,
    MODERATOR_LIST,
    MODERATOR_BY_ID,
    CREATE_MODERATOR,
    UPDATE_MODERATOR,
    DELETE_MODERATOR,
    MODERATOR_EVENTS,
} from '../constants/actionTypes';

const initialState = {
    moderators: [],
    selectedModerator: null,
    moderatorEvents: [],
    loading: false,
    error: null,
};

const moderatorReducer = (state = initialState, action) => {
    switch (action.type) {
        case MODERATOR_LOADING:
            return {
                ...state,
                loading: action.payload,
            };
            
        case MODERATOR_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false,
            };
            
        case MODERATOR_LIST:
            return {
                ...state,
                moderators: action.payload,
                loading: false,
                error: null,
            };
            
        case MODERATOR_BY_ID:
            return {
                ...state,
                selectedModerator: action.payload,
                loading: false,
                error: null,
            };
            
        case CREATE_MODERATOR:
            return {
                ...state,
                moderators: [...state.moderators, action.payload],
                loading: false,
                error: null,
            };
            
        case UPDATE_MODERATOR:
            return {
                ...state,
                moderators: state.moderators.map((moderator) =>
                    moderator.id === action.payload.id ? action.payload : moderator
                ),
                selectedModerator: action.payload.id === state.selectedModerator?.id 
                    ? action.payload 
                    : state.selectedModerator,
                loading: false,
                error: null,
            };
            
        case DELETE_MODERATOR:
            return {
                ...state,
                moderators: state.moderators.filter((moderator) => moderator.id !== action.payload),
                selectedModerator: state.selectedModerator?.id === action.payload 
                    ? null 
                    : state.selectedModerator,
                loading: false,
                error: null,
            };

        case MODERATOR_EVENTS:
            return {
                ...state,
                moderatorEvents: action.payload,
                loading: false,
                error: null,
            };
            
        default:
            return state;
    }
};

export default moderatorReducer;

