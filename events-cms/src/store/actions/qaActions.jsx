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
    UPDATE_QUESTION,
    DELETE_QUESTION,
    CLEAR_QA_ERROR
} from '../constants/actionTypes';

// Get Q&A questions for an event
export const getQAQuestions =
    (eventId, filters = {}) =>
    async (dispatch) => {
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
        const response = await axiosInstance.put(`/events/qna/${questionId}/answer`, {
            answer: answer
        });

        // Use the backend response structure properly
        const answerData = {
            questionId,
            answer: response.data.data.answer,
            answeredAt: response.data.data.answeredAt || new Date().toISOString(),
            answeredBy: response.data.data.answeredBy,
            isUpdated: response.data.data.isUpdated,
            status: response.data.data.status || 'answered'
        };

        dispatch({
            type: ANSWER_QUESTION,
            payload: answerData
        });

        // Use the message from backend response
        const successMessage = response.data.message || 'Answer submitted successfully!';
        toast.success(successMessage);

        return response.data;
    } catch (error) {
        console.error('Error answering question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to submit answer' });

        toast.error(error.response?.data?.message || 'Failed to submit answer');
        throw error;
    }
};

// Pin a question
export const pinQuestion = (questionId) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/events/qna/${questionId}/pin`, {
            isPinned: true
        });

        dispatch({
            type: PIN_QUESTION,
            payload: {
                questionId,
                isPinned: true
            }
        });

        toast.success('Question pinned successfully!');

        return response.data;
    } catch (error) {
        console.error('Error pinning question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to pin question' });

        toast.error(error.response?.data?.message || 'Failed to pin question');
        throw error;
    }
};

// Unpin a question
export const unpinQuestion = (questionId) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/events/qna/${questionId}/pin`, {
            isPinned: false
        });

        dispatch({
            type: UNPIN_QUESTION,
            payload: {
                questionId,
                isPinned: false
            }
        });

        toast.success('Question unpinned successfully!');

        return response.data;
    } catch (error) {
        console.error('Error unpinning question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to unpin question' });

        toast.error(error.response?.data?.message || 'Failed to unpin question');
        throw error;
    }
};

// Like a question
export const likeQuestion = (questionId) => async (dispatch) => {
    try {
        const response = await axiosInstance.post(`/events/qna/like`, {
            questionId: questionId
        });

        dispatch({
            type: LIKE_QUESTION,
            payload: {
                questionId,
                liked: response.data.data?.liked,
                likesCount: response.data.data?.likesCount
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error liking question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to like question' });

        toast.error(error.response?.data?.message || 'Failed to like question');
        throw error;
    }
};

// Unlike a question
export const unlikeQuestion = (questionId) => async (dispatch) => {
    try {
        const response = await axiosInstance.post(`/events/qna/like`, {
            questionId: questionId
        });

        dispatch({
            type: UNLIKE_QUESTION,
            payload: {
                questionId,
                liked: response.data.data?.liked,
                likesCount: response.data.data?.likesCount
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error unliking question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to unlike question' });

        toast.error(error.response?.data?.message || 'Failed to unlike question');
        throw error;
    }
};

// Clear QA errors
export const clearQAError = () => (dispatch) => {
    dispatch({ type: CLEAR_QA_ERROR });
};

// Update a question
export const updateQuestion = (questionId, updateData) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/events/qna/${questionId}`, updateData);

        dispatch({
            type: UPDATE_QUESTION,
            payload: {
                questionId,
                ...response.data.data
            }
        });

        toast.success('Question updated successfully!');

        return response.data;
    } catch (error) {
        console.error('Error updating question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to update question' });

        toast.error(error.response?.data?.message || 'Failed to update question');
        throw error;
    }
};

// Delete a question (admin only)
export const deleteQuestion = (questionId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/qna/admin/${questionId}`);

        dispatch({
            type: DELETE_QUESTION,
            payload: questionId
        });

        toast.success('Question deleted successfully!');

        return response.data;
    } catch (error) {
        console.error('Error deleting question:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to delete question' });

        toast.error(error.response?.data?.message || 'Failed to delete question');
        throw error;
    }
};

// Update question status
export const updateQuestionStatus = (questionId, status) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/events/qna/admin/update-status`, {
            questionId,
            status
        });

        dispatch({
            type: UPDATE_QUESTION,
            payload: {
                questionId,
                status: response.data.data.status,
                answeredAt: response.data.data.answeredAt
            }
        });

        toast.success('Question status updated successfully!');

        return response.data;
    } catch (error) {
        console.error('Error updating question status:', error);
        dispatch({ type: QA_ERROR, payload: error.response?.data?.message || 'Failed to update question status' });
        toast.error(error.response?.data?.message || 'Failed to update question status');
        throw error;
    }
};

// Clear QA data
export const clearQAData = () => (dispatch) => {
    dispatch({ type: QA_QUESTIONS_LIST, payload: [] });
    dispatch({ type: QA_QUESTION_BY_ID, payload: null });
};
