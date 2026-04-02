import {
    ENGAGEMENT_QNA_LOADING,
    ENGAGEMENT_QNA_ERROR,
    ENGAGEMENT_QNA_LIST,
    ENGAGEMENT_QNA_BY_ID,
    CREATE_ENGAGEMENT_QNA,
    UPDATE_ENGAGEMENT_QNA,
    DELETE_ENGAGEMENT_QNA,
    LIKE_ENGAGEMENT_QNA,
} from '../constants/actionTypes';

const initialState = {
    engagementQuestions: [],
    pagination: {},
    selectedQuestion: null,
    loading: false,
    error: null,
};

const engagementQnaReducer = (state = initialState, action) => {
    switch (action.type) {
        case ENGAGEMENT_QNA_LOADING:
            return {
                ...state,
                loading: action.payload,
            };
            
        case ENGAGEMENT_QNA_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false,
            };
            
        case ENGAGEMENT_QNA_LIST:
            let questionsData = [];
            let paginationData = {};
            if (action.payload) {
                if (Array.isArray(action.payload)) {
                    questionsData = action.payload;
                } else if (action.payload.data !== undefined && action.payload.data !== null) {
                    questionsData = Array.isArray(action.payload.data) ? action.payload.data : [];
                    paginationData = action.payload.pagination || {};
                }
            }
            return {
                ...state,
                engagementQuestions: questionsData,
                pagination: paginationData,
                loading: false,
                error: null,
            };
            
        case ENGAGEMENT_QNA_BY_ID:
            return {
                ...state,
                selectedQuestion: action.payload,
                loading: false,
                error: null,
            };
            
        case CREATE_ENGAGEMENT_QNA:
            return {
                ...state,
                engagementQuestions: [...state.engagementQuestions, action.payload],
                loading: false,
                error: null,
            };
            
        case UPDATE_ENGAGEMENT_QNA:
            return {
                ...state,
                engagementQuestions: state.engagementQuestions.map((question) =>
                    question.id === action.payload.id ? action.payload : question
                ),
                selectedQuestion: action.payload.id === state.selectedQuestion?.id 
                    ? action.payload 
                    : state.selectedQuestion,
                loading: false,
                error: null,
            };

        case LIKE_ENGAGEMENT_QNA:
            return {
                ...state,
                engagementQuestions: state.engagementQuestions.map((question) =>
                    question.id === action.payload.questionId 
                        ? { 
                            ...question, 
                            likesCount: action.payload.likesCount,
                            userLiked: action.payload.liked
                        } 
                        : question
                ),
                selectedQuestion: state.selectedQuestion?.id === action.payload.questionId
                    ? {
                        ...state.selectedQuestion,
                        likesCount: action.payload.likesCount,
                        userLiked: action.payload.liked
                    }
                    : state.selectedQuestion,
                loading: false,
                error: null,
            };
            
        case DELETE_ENGAGEMENT_QNA:
            return {
                ...state,
                engagementQuestions: state.engagementQuestions.filter((question) => question.id !== action.payload),
                selectedQuestion: state.selectedQuestion?.id === action.payload 
                    ? null 
                    : state.selectedQuestion,
                loading: false,
                error: null,
            };
            
        default:
            return state;
    }
};

export default engagementQnaReducer;

