import {
    SURVEY_LIST_REQUEST,
    SURVEY_LIST_SUCCESS,
    SURVEY_LIST_FAILURE,
    SURVEY_DELETE_REQUEST,
    SURVEY_DELETE_SUCCESS,
    SURVEY_DELETE_FAILURE,
    SURVEY_CREATE_REQUEST,
    SURVEY_CREATE_SUCCESS,
    SURVEY_CREATE_FAILURE,
    SURVEY_UPDATE_REQUEST,
    SURVEY_UPDATE_SUCCESS,
    SURVEY_UPDATE_FAILURE,
    SURVEY_DETAIL_REQUEST,
    SURVEY_DETAIL_SUCCESS,
    SURVEY_DETAIL_FAILURE,
    SET_SURVEY_LOADING,
    SET_SURVEY_ERROR,
} from '../actions/surveyActions';

const initialState = {
    surveys: [],
    selectedSurvey: null,
    loading: false,
    error: null,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
};

const surveyReducer = (state = initialState, action) => {
    switch (action.type) {
        // List surveys
        case SURVEY_LIST_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case SURVEY_LIST_SUCCESS:
            return {
                ...state,
                loading: false,
                surveys: action.payload,
                error: null,
            };
        case SURVEY_LIST_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        // Survey detail
        case SURVEY_DETAIL_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case SURVEY_DETAIL_SUCCESS:
            return {
                ...state,
                loading: false,
                selectedSurvey: action.payload,
                error: null,
            };
        case SURVEY_DETAIL_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        // Create survey
        case SURVEY_CREATE_REQUEST:
            return {
                ...state,
                createLoading: true,
                error: null,
            };
        case SURVEY_CREATE_SUCCESS:
            return {
                ...state,
                createLoading: false,
                surveys: [action.payload, ...state.surveys],
                error: null,
            };
        case SURVEY_CREATE_FAILURE:
            return {
                ...state,
                createLoading: false,
                error: action.payload,
            };

        // Update survey
        case SURVEY_UPDATE_REQUEST:
            return {
                ...state,
                updateLoading: true,
                error: null,
            };
        case SURVEY_UPDATE_SUCCESS:
            return {
                ...state,
                updateLoading: false,
                surveys: state.surveys.map((survey) =>
                    survey.id === action.payload.id ? action.payload : survey
                ),
                selectedSurvey: action.payload,
                error: null,
            };
        case SURVEY_UPDATE_FAILURE:
            return {
                ...state,
                updateLoading: false,
                error: action.payload,
            };

        // Delete survey
        case SURVEY_DELETE_REQUEST:
            return {
                ...state,
                deleteLoading: true,
                error: null,
            };
        case SURVEY_DELETE_SUCCESS:
            return {
                ...state,
                deleteLoading: false,
                surveys: state.surveys.filter((survey) => survey.id !== action.payload),
                error: null,
            };
        case SURVEY_DELETE_FAILURE:
            return {
                ...state,
                deleteLoading: false,
                error: action.payload,
            };

        // Set loading and error states
        case SET_SURVEY_LOADING:
            return {
                ...state,
                loading: action.payload,
            };
        case SET_SURVEY_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false,
            };

        default:
            return state;
    }
};

export default surveyReducer;
