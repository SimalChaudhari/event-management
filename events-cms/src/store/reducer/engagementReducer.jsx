import {
    ENGAGEMENT_LOADING,
    ENGAGEMENT_ERROR,
    ENGAGEMENT_LIST,
    ENGAGEMENT_BY_ID,
    ENGAGEMENT_BY_TRACK,
    CREATE_ENGAGEMENT,
    UPDATE_ENGAGEMENT,
    DELETE_ENGAGEMENT,
    TOGGLE_ENGAGEMENT_STATUS,
    CLEAR_ENGAGEMENT_ERROR
} from '../constants/actionTypes';

const initialState = {
    engagements: [],
    selectedEngagement: null,
    trackEngagements: {}, // Store engagements by trackId: { trackId1: [engagements], trackId2: [engagements] }
    events: [], // Events that have engagements (for filter dropdown)
    pagination: {}, // Pagination metadata
    loading: false,
    error: null,
};

const engagementReducer = (state = initialState, action) => {
    switch (action.type) {
        case ENGAGEMENT_LOADING:
            return {
                ...state,
                loading: action.payload,
            };
            
        case ENGAGEMENT_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false,
            };
            
        case CLEAR_ENGAGEMENT_ERROR:
            return {
                ...state,
                error: null,
            };
            
        case ENGAGEMENT_LIST:
            // Handle both old format (array directly) and new format (object with data and pagination)
            let engagementsData = [];
            if (action.payload) {
                if (Array.isArray(action.payload)) {
                    // Old format: payload is directly an array
                    engagementsData = action.payload;
                } else if (action.payload.data !== undefined && action.payload.data !== null) {
                    // New format: payload has data property
                    engagementsData = Array.isArray(action.payload.data) ? action.payload.data : [];
                }
            }
            
            return {
                ...state,
                engagements: engagementsData,
                pagination: action.payload?.pagination || {},
                loading: false,
                error: null,
            };
            
        case 'ENGAGEMENT_EVENTS_LIST':
            return {
                ...state,
                events: action.payload,
            };
            
        case ENGAGEMENT_BY_ID:
            return {
                ...state,
                selectedEngagement: action.payload,
                loading: false,
                error: null,
            };
            
        case ENGAGEMENT_BY_TRACK:
            return {
                ...state,
                trackEngagements: {
                    ...state.trackEngagements,
                    [action.payload.trackId]: action.payload.engagements
                },
                loading: false,
                error: null,
            };
            
        case CREATE_ENGAGEMENT:
            return {
                ...state,
                engagements: [...state.engagements, action.payload],
                loading: false,
                error: null,
            };
            
        case UPDATE_ENGAGEMENT:
        case TOGGLE_ENGAGEMENT_STATUS:
            return {
                ...state,
                engagements: state.engagements.map((engagement) =>
                    engagement.id === action.payload.id ? action.payload : engagement
                ),
                selectedEngagement: action.payload.id === state.selectedEngagement?.id 
                    ? action.payload 
                    : state.selectedEngagement,
                loading: false,
                error: null,
            };
            
        case DELETE_ENGAGEMENT:
            return {
                ...state,
                engagements: state.engagements.filter((engagement) => engagement.id !== action.payload),
                selectedEngagement: state.selectedEngagement?.id === action.payload 
                    ? null 
                    : state.selectedEngagement,
                loading: false,
                error: null,
            };
            
        default:
            return state;
    }
};

export default engagementReducer;

