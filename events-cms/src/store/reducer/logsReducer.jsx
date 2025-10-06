import { 
    LOGS_LIST, 
    LOGS_LOADING, 
    LOGS_ERROR, 
    LOG_BY_ID, 
    LOGS_STATISTICS, 
    CREATE_SAMPLE_LOGS,
    CLEAR_LOGS_ERROR 
} from '../constants/actionTypes';

const initialState = {
    logs: [],
    selectedLog: null,
    statistics: null,
    pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
    },
    loading: false,
    error: null
};

const logsReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case LOGS_LOADING:
            return {
                ...state,
                loading: payload
            };

        case LOGS_ERROR:
            return {
                ...state,
                loading: false,
                error: payload
            };

        case CLEAR_LOGS_ERROR:
            return {
                ...state,
                error: null
            };

        case LOGS_LIST:
            return {
                ...state,
                logs: payload.logs,
                pagination: {
                    total: payload.total,
                    page: payload.page,
                    limit: payload.limit,
                    totalPages: payload.totalPages
                },
                loading: false,
                error: null
            };

        case LOG_BY_ID:
            return {
                ...state,
                selectedLog: payload,
                loading: false,
                error: null
            };

        case LOGS_STATISTICS:
            return {
                ...state,
                statistics: payload,
                loading: false,
                error: null
            };

        case CREATE_SAMPLE_LOGS:
            return {
                ...state,
                loading: false,
                error: null
            };

        default:
            return state;
    }
};

export default logsReducer;

