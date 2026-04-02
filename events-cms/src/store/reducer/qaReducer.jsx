import { 
    QA_LOADING, 
    QA_ERROR, 
    QA_QUESTIONS_LIST, 
    QA_QUESTION_BY_ID, 
    ANSWER_QUESTION, 
    PIN_QUESTION, 
    UNPIN_QUESTION, 
    LIKE_QUESTION, 
    UNLIKE_QUESTION,
    UPDATE_QUESTION,
    DELETE_QUESTION,
    CLEAR_QA_ERROR 
} from "../constants/actionTypes";

const initialState = {
    questions: [],
    questionById: null,
    loading: false,
    error: null
};

const qaReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case QA_LOADING:
            return {
                ...state,
                loading: payload
            };
            
        case QA_ERROR:
            return {
                ...state,
                error: payload,
                loading: false
            };
            
        case CLEAR_QA_ERROR:
            return {
                ...state,
                error: null
            };
            
        case QA_QUESTIONS_LIST:
            return {
                ...state,
                questions: payload,
                loading: false,
                error: null
            };
            
        case QA_QUESTION_BY_ID:
            return {
                ...state,
                questionById: payload,
                loading: false,
                error: null
            };
            
        case ANSWER_QUESTION:
            return {
                ...state,
                questions: state.questions.map(question => 
                    question.id === payload.questionId 
                        ? { 
                            ...question, 
                            answer: payload.answer,
                            isAnswered: true,
                            answeredAt: payload.answeredAt,
                            answeredBy: payload.answeredBy,
                            isUpdated: payload.isUpdated,
                            status: payload.status,
                            updatedAt: payload.answeredAt
                        }
                        : question
                ),
                questionById: state.questionById?.id === payload.questionId 
                    ? { 
                        ...state.questionById, 
                        answer: payload.answer,
                        isAnswered: true,
                        answeredAt: payload.answeredAt,
                        answeredBy: payload.answeredBy,
                        isUpdated: payload.isUpdated,
                        status: payload.status,
                        updatedAt: payload.answeredAt
                    }
                    : state.questionById,
                loading: false,
                error: null
            };
            
        case PIN_QUESTION:
            return {
                ...state,
                questions: state.questions.map(question => 
                    question.id === payload.questionId 
                        ? { 
                            ...question, 
                            isPinned: true,
                            pinnedAt: payload.pinnedAt,
                            updatedAt: payload.pinnedAt
                        }
                        : question
                ),
                questionById: state.questionById?.id === payload.questionId 
                    ? { 
                        ...state.questionById, 
                        isPinned: true,
                        pinnedAt: payload.pinnedAt,
                        updatedAt: payload.pinnedAt
                    }
                    : state.questionById,
                loading: false,
                error: null
            };
            
        case UNPIN_QUESTION:
            return {
                ...state,
                questions: state.questions.map(question => 
                    question.id === payload.questionId 
                        ? { 
                            ...question, 
                            isPinned: false,
                            unpinnedAt: payload.unpinnedAt,
                            updatedAt: payload.unpinnedAt
                        }
                        : question
                ),
                questionById: state.questionById?.id === payload.questionId 
                    ? { 
                        ...state.questionById, 
                        isPinned: false,
                        unpinnedAt: payload.unpinnedAt,
                        updatedAt: payload.unpinnedAt
                    }
                    : state.questionById,
                loading: false,
                error: null
            };
            
        case LIKE_QUESTION:
            return {
                ...state,
                questions: state.questions.map(question => 
                    question.id === payload.questionId 
                        ? { 
                            ...question, 
                            totalLikes: payload.totalLikes,
                            isLiked: true,
                            likedAt: payload.likedAt,
                            updatedAt: payload.likedAt
                        }
                        : question
                ),
                questionById: state.questionById?.id === payload.questionId 
                    ? { 
                        ...state.questionById, 
                        totalLikes: payload.totalLikes,
                        isLiked: true,
                        likedAt: payload.likedAt,
                        updatedAt: payload.likedAt
                    }
                    : state.questionById,
                loading: false,
                error: null
            };
            
        case UNLIKE_QUESTION:
            return {
                ...state,
                questions: state.questions.map(question => 
                    question.id === payload.questionId 
                        ? { 
                            ...question, 
                            totalLikes: payload.totalLikes,
                            isLiked: false,
                            unlikedAt: payload.unlikedAt,
                            updatedAt: payload.unlikedAt
                        }
                        : question
                ),
                questionById: state.questionById?.id === payload.questionId 
                    ? { 
                        ...state.questionById, 
                        totalLikes: payload.totalLikes,
                        isLiked: false,
                        unlikedAt: payload.unlikedAt,
                        updatedAt: payload.unlikedAt
                    }
                    : state.questionById,
                loading: false,
                error: null
            };

        case UPDATE_QUESTION:
            return {
                ...state,
                questions: state.questions.map(question => 
                    question.id === payload.questionId 
                        ? { 
                            ...question, 
                            ...payload,
                            updatedAt: new Date().toISOString()
                        }
                        : question
                ),
                questionById: state.questionById?.id === payload.questionId 
                    ? { 
                        ...state.questionById, 
                        ...payload,
                        updatedAt: new Date().toISOString()
                    }
                    : state.questionById,
                loading: false,
                error: null
            };

        case DELETE_QUESTION:
            return {
                ...state,
                questions: state.questions.filter(question => question.id !== payload),
                questionById: state.questionById?.id === payload ? null : state.questionById,
                loading: false,
                error: null
            };
            
        default:
            return state;
    }
};

export default qaReducer;
