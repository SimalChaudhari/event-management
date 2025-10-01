import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';

// Action Types
export const SURVEY_LIST_REQUEST = 'SURVEY_LIST_REQUEST';
export const SURVEY_LIST_SUCCESS = 'SURVEY_LIST_SUCCESS';
export const SURVEY_LIST_FAILURE = 'SURVEY_LIST_FAILURE';

export const SURVEY_DELETE_REQUEST = 'SURVEY_DELETE_REQUEST';
export const SURVEY_DELETE_SUCCESS = 'SURVEY_DELETE_SUCCESS';
export const SURVEY_DELETE_FAILURE = 'SURVEY_DELETE_FAILURE';

export const SURVEY_CREATE_REQUEST = 'SURVEY_CREATE_REQUEST';
export const SURVEY_CREATE_SUCCESS = 'SURVEY_CREATE_SUCCESS';
export const SURVEY_CREATE_FAILURE = 'SURVEY_CREATE_FAILURE';

export const SURVEY_UPDATE_REQUEST = 'SURVEY_UPDATE_REQUEST';
export const SURVEY_UPDATE_SUCCESS = 'SURVEY_UPDATE_SUCCESS';
export const SURVEY_UPDATE_FAILURE = 'SURVEY_UPDATE_FAILURE';

export const SURVEY_DETAIL_REQUEST = 'SURVEY_DETAIL_REQUEST';
export const SURVEY_DETAIL_SUCCESS = 'SURVEY_DETAIL_SUCCESS';
export const SURVEY_DETAIL_FAILURE = 'SURVEY_DETAIL_FAILURE';

export const SET_SURVEY_LOADING = 'SET_SURVEY_LOADING';
export const SET_SURVEY_ERROR = 'SET_SURVEY_ERROR';

// Set Loading State
export const setSurveyLoading = (loading) => ({
    type: SET_SURVEY_LOADING,
    payload: loading
});

// Set Error State
export const setSurveyError = (error) => ({
    type: SET_SURVEY_ERROR,
    payload: error
});

// Get all surveys (Admin)
export const surveyList = () => async (dispatch) => {
    try {
        dispatch(setSurveyLoading(true));

        const response = await axiosInstance.get('/events/surveys/current');

        dispatch({
            type: SURVEY_LIST_SUCCESS,
            payload: response.data.data
        });

        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch surveys';
        dispatch(setSurveyError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setSurveyLoading(false));
    }
    return false;
};

// Get single survey details
export const surveyDetail = (surveyId) => async (dispatch) => {
    try {
        dispatch(setSurveyLoading(true));

        const response = await axiosInstance.get(`/events/surveys/${surveyId}`);

        dispatch({
            type: SURVEY_DETAIL_SUCCESS,
            payload: response.data.data
        });

        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch survey details';
        dispatch(setSurveyError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setSurveyLoading(false));
    }
    return false;
};

// Create new survey
export const surveyCreate = (surveyData) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/events/surveys', surveyData);
        dispatch({
            type: SURVEY_CREATE_SUCCESS,
            payload: response.data.data
        });

        toast.success(response.data.message || 'Survey created successfully!');
        return { success: true };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create survey';
        toast.error(errorMessage);
        return { error: true };
    }
};

// Update survey
export const surveyUpdate = (surveyId, surveyData) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/events/surveys/${surveyId}`, surveyData);

        dispatch({
            type: SURVEY_UPDATE_SUCCESS,
            payload: response.data.data?.survey || response.data.survey
        });

        toast.success(response.data.message || 'Survey updated successfully!');
        return { success: true };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update survey';
        toast.error(errorMessage);
        return { error: true };
    }
};

// Delete survey
export const surveyDelete = (surveyId) => async (dispatch) => {
    try {
        dispatch(setSurveyLoading(true));

        const response = await axiosInstance.delete(`/events/surveys/${surveyId}`);

        dispatch({
            type: SURVEY_DELETE_SUCCESS,
            payload: surveyId
        });

        toast.success(response.data.message || 'Survey deleted successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete survey';
        dispatch(setSurveyError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setSurveyLoading(false));
    }
    return false;
};

// Add session to survey
export const addSessionToSurvey = (surveyId, sessionData) => async (dispatch) => {
    try {
        dispatch(setSurveyLoading(true));

        const response = await axiosInstance.post(`/events/surveys/${surveyId}/sessions`, sessionData);

        toast.success(response.data.message || 'Session added successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to add session';
        dispatch(setSurveyError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setSurveyLoading(false));
    }
    return false;
};

// Update session
export const updateSession = (surveyId, sessionId, sessionData) => async (dispatch) => {
    try {
        dispatch(setSurveyLoading(true));

        const response = await axiosInstance.put(`/events/surveys/${surveyId}/sessions/${sessionId}`, sessionData);

        toast.success(response.data.message || 'Session updated successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update session';
        dispatch(setSurveyError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setSurveyLoading(false));
    }
    return false;
};

// Delete session
export const deleteSession = (surveyId, sessionId) => async (dispatch) => {
    try {
        dispatch(setSurveyLoading(true));

        const response = await axiosInstance.delete(`/events/surveys/${surveyId}/sessions/${sessionId}`);

        toast.success(response.data.message || 'Session deleted successfully!');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete session';
        dispatch(setSurveyError(errorMessage));
        toast.error(errorMessage);
    } finally {
        dispatch(setSurveyLoading(false));
    }
    return false;
};

// Get event suggestions for survey creation
export const getEventSuggestions = (eventId) => async (dispatch) => {
    try {
        dispatch(setSurveyLoading(true));

        const response = await axiosInstance.get(`/events/surveys/suggestions/${eventId}`);

        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to get event suggestions';
        dispatch(setSurveyError(errorMessage));
        toast.error(errorMessage);
        return null;
    } finally {
        dispatch(setSurveyLoading(false));
    }
};
