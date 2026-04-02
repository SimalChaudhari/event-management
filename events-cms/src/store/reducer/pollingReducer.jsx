import {
    POLLING_LOADING,
    POLLING_ERROR,
    POLLING_LIST,
    POLL_BY_ID,
    CREATE_POLL,
    UPDATE_POLL,
    DELETE_POLL,
    TOGGLE_POLL_LIVE,
    POLL_RESULTS,
    POLL_VOTES,
    CLEAR_POLLING_ERROR
} from '../constants/actionTypes';

const initialState = {
    polls: [],
    pollById: null,
    pollResults: null,
    loading: false,
    error: null
};

const pollingReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case POLLING_LOADING:
            return {
                ...state,
                loading: payload
            };

        case POLLING_ERROR:
            return {
                ...state,
                error: payload,
                loading: false
            };

        case CLEAR_POLLING_ERROR:
            return {
                ...state,
                error: null
            };

        case POLLING_LIST:
            return {
                ...state,
                polls: payload,
                loading: false,
                error: null
            };

        case POLL_BY_ID:
            return {
                ...state,
                pollById: payload,
                loading: false,
                error: null
            };

        case CREATE_POLL:
            // After creating, just mark as not loading
            // The list will be refreshed by dispatching getAllPolls()
            return {
                ...state,
                loading: false,
                error: null
            };

        case UPDATE_POLL:
            // After updating, just mark as not loading
            // The list will be refreshed by dispatching getAllPolls()
            return {
                ...state,
                pollById: state.pollById?.id === payload.id ? payload : state.pollById,
                loading: false,
                error: null
            };

        case DELETE_POLL:
            // After deleting, just mark as not loading
            // The list will be refreshed by dispatching getAllPolls()
            return {
                ...state,
                pollById: state.pollById?.id === payload ? null : state.pollById,
                loading: false,
                error: null
            };

        case TOGGLE_POLL_LIVE:
            // After toggling, just mark as not loading
            // The list will be refreshed by dispatching getAllPolls()
            return {
                ...state,
                pollById: state.pollById?.id === payload.id 
                    ? { ...state.pollById, isLive: payload.isLive } 
                    : state.pollById,
                loading: false,
                error: null
            };

        case POLL_RESULTS:
            return {
                ...state,
                pollResults: payload,
                loading: false,
                error: null
            };

        default:
            return state;
    }
};

export default pollingReducer;

