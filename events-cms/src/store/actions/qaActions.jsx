import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
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
    CLEAR_QA_ERROR 
} from '../constants/actionTypes';

// Get Q&A questions for an event
export const getQAQuestions = (eventId, filters = {}) => async (dispatch) => {
    try {
        dispatch({ type: QA_LOADING, payload: true });
        
        const queryParams = new URLSearchParams();
        queryParams.append('eventId', eventId);
        
        if (filters.status) {
            queryParams.append('status', filters.status);
        }
        
        if (filters.speakerId) {
            queryParams.append('speakerId', filters.speakerId);
        }
        
        if (filters.isPinned) {
            queryParams.append('isPinned', filters.isPinned);
        }
        
        if (filters.isAnswered) {
            queryParams.append('isAnswered', filters.isAnswered);
        }

        const response = await axiosInstance.get(`/events/qna?${queryParams.toString()}`);
        
        dispatch({
            type: QA_QUESTIONS_LIST,
            payload: response.data
        });
        
        dispatch({ type: QA_LOADING, payload: false });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching Q&A questions:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to fetch Q&A questions' });
        dispatch({ type: QA_LOADING, payload: false });
        toast.error(error.response?.data?.message || 'Failed to fetch Q&A questions');
        throw error;
    }
};

// Get a specific question by ID
export const getQuestionById = (questionId) => async (dispatch) => {
    try {
        dispatch({ type: QA_LOADING, payload: true });
        
        const response = await axiosInstance.get(`/events/qna/${questionId}`);
        
        dispatch({
            type: QA_QUESTION_BY_ID,
            payload: response.data
        });
        
        dispatch({ type: QA_LOADING, payload: false });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to fetch question' });
        dispatch({ type: QA_LOADING, payload: false });
        toast.error(error.response?.data?.message || 'Failed to fetch question');
        throw error;
    }
};

// Answer a question
export const answerQuestion = (questionId, answer) => async (dispatch) => {
    try {
        dispatch({ type: QA_LOADING, payload: true });
        
        const response = await axiosInstance.put(`/events/qna/${questionId}/answer`, {
            answer: answer
        });
        
        dispatch({
            type: ANSWER_QUESTION,
            payload: {
                questionId,
                answer: response.data.answer,
                answeredAt: response.data.answeredAt || new Date().toISOString()
            }
        });
        
        dispatch({ type: QA_LOADING, payload: false });
        toast.success('Answer submitted successfully!');
        
        return response.data;
    } catch (error) {
        console.error('Error answering question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to submit answer' });
        dispatch({ type: QA_LOADING, payload: false });
        toast.error(error.response?.data?.message || 'Failed to submit answer');
        throw error;
    }
};

// Pin a question
export const pinQuestion = (questionId) => async (dispatch) => {
    try {
        dispatch({ type: QA_LOADING, payload: true });
        
        const response = await axiosInstance.post(`/api/events/qna/${questionId}/pin`);
        
        dispatch({
            type: PIN_QUESTION,
            payload: {
                questionId,
                pinnedAt: response.data.pinnedAt || new Date().toISOString()
            }
        });
        
        dispatch({ type: QA_LOADING, payload: false });
        toast.success('Question pinned successfully!');
        
        return response.data;
    } catch (error) {
        console.error('Error pinning question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to pin question' });
        dispatch({ type: QA_LOADING, payload: false });
        toast.error(error.response?.data?.message || 'Failed to pin question');
        throw error;
    }
};

// Unpin a question
export const unpinQuestion = (questionId) => async (dispatch) => {
    try {
        dispatch({ type: QA_LOADING, payload: true });
        
        const response = await axiosInstance.post(`/api/events/qna/${questionId}/unpin`);
        
        dispatch({
            type: UNPIN_QUESTION,
            payload: {
                questionId,
                unpinnedAt: response.data.unpinnedAt || new Date().toISOString()
            }
        });
        
        dispatch({ type: QA_LOADING, payload: false });
        toast.success('Question unpinned successfully!');
        
        return response.data;
    } catch (error) {
        console.error('Error unpinning question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to unpin question' });
        dispatch({ type: QA_LOADING, payload: false });
        toast.error(error.response?.data?.message || 'Failed to unpin question');
        throw error;
    }
};

// Like a question
export const likeQuestion = (questionId) => async (dispatch) => {
    try {
        dispatch({ type: QA_LOADING, payload: true });
        
        const response = await axiosInstance.post(`/api/events/qna/${questionId}/like`);
        
        dispatch({
            type: LIKE_QUESTION,
            payload: {
                questionId,
                totalLikes: response.data.totalLikes,
                likedAt: response.data.likedAt || new Date().toISOString()
            }
        });
        
        dispatch({ type: QA_LOADING, payload: false });
        
        return response.data;
    } catch (error) {
        console.error('Error liking question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to like question' });
        dispatch({ type: QA_LOADING, payload: false });
        toast.error(error.response?.data?.message || 'Failed to like question');
        throw error;
    }
};

// Unlike a question
export const unlikeQuestion = (questionId) => async (dispatch) => {
    try {
        dispatch({ type: QA_LOADING, payload: true });
        
        const response = await axiosInstance.post(`/events/qna/${questionId}/unlike`);
        
        dispatch({
            type: UNLIKE_QUESTION,
            payload: {
                questionId,
                totalLikes: response.data.totalLikes,
                unlikedAt: response.data.unlikedAt || new Date().toISOString()
            }
        });
        
        dispatch({ type: QA_LOADING, payload: false });
        
        return response.data;
    } catch (error) {
        console.error('Error unliking question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to unlike question' });
        dispatch({ type: QA_LOADING, payload: false });
        toast.error(error.response?.data?.message || 'Failed to unlike question');
        throw error;
    }
};

// Clear QA errors
export const clearQAError = () => (dispatch) => {
    dispatch({ type: CLEAR_QA_ERROR });
};

// Clear QA data
export const clearQAData = () => (dispatch) => {
    dispatch({ type: QA_QUESTIONS_LIST, payload: [] });
    dispatch({ type: QA_QUESTION_BY_ID, payload: null });
};
