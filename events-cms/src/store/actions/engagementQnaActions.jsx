import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
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

// Helper actions
const setLoading = (isLoading) => ({
    type: ENGAGEMENT_QNA_LOADING,
    payload: isLoading
});

const setError = (error) => ({
    type: ENGAGEMENT_QNA_ERROR,
    payload: error
});

// 1. Create Question
export const createEngagementQuestion = (engagementId, questionText) => async (dispatch) => {
    try {
        dispatch(setLoading(true));

        const response = await axiosInstance.post('/engagements/qna', {
            engagementId,
            question: questionText
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Question created successfully!');
            
            dispatch({
                type: CREATE_ENGAGEMENT_QNA,
                payload: response.data.data
            });
            
            return { success: true, data: response.data.data };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create question';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

// 2. Answer Question (Admin only)
export const answerEngagementQuestion = (questionId, answer) => async (dispatch) => {
    try {
        dispatch(setLoading(true));

        const response = await axiosInstance.put(`/engagements/qna/${questionId}/answer`, {
            answer
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Answer submitted successfully!');
            
            dispatch({
                type: UPDATE_ENGAGEMENT_QNA,
                payload: response.data.data
            });
            
            return { success: true, data: response.data.data };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to submit answer';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

// 3. Like/Unlike Question
export const toggleEngagementQuestionLike = (questionId) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/engagements/qna/like', {
            questionId
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Vote updated successfully!');
            
            dispatch({
                type: LIKE_ENGAGEMENT_QNA,
                payload: response.data.data
            });
            
            return { success: true, data: response.data.data };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update vote';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
    }
};

// 4. Get All Questions for Engagement (with pagination support)
export const getEngagementQAQuestions = (engagementId, status = 'all', sortBy = 'likes', sessionId = null, filters = {}) => async (dispatch) => {
    try {
        dispatch(setLoading(true));

        // Build params object
        let params = { ...filters };
        
        if (sessionId) {
            params.sessionId = sessionId;
        } else if (engagementId) {
            params.engagementId = engagementId;
        }
        
        // Add status and sortBy if not in filters
        // Priority: use status from filters object first, then from status parameter
        // Only add status if it's not 'all' (backend doesn't need 'all' status)
        if (params.status === 'all') {
            // Remove 'all' status from params
            delete params.status;
        } else if (!params.status && status && status !== 'all') {
            params.status = status;
        }
        if (!params.sortBy && sortBy) {
            params.sortBy = sortBy;
        }

        const response = await axiosInstance.get('/engagements/qna/questions', { params });

        if (response && response.status >= 200 && response.status < 300) {
            const hasPagination = filters.page !== undefined || filters.limit !== undefined;
            const questionsData = hasPagination 
                ? (Array.isArray(response.data.data) ? response.data.data : [])
                : (response.data.data?.questions || []);
            const paginationData = response.data.metadata || {};

            if (hasPagination) {
                dispatch({
                    type: ENGAGEMENT_QNA_LIST,
                    payload: {
                        data: questionsData,
                        pagination: paginationData
                    }
                });
            } else {
                dispatch({
                    type: ENGAGEMENT_QNA_LIST,
                    payload: questionsData
                });
            }
            
            return { 
                success: true, 
                data: questionsData,
                pagination: paginationData,
                metadata: paginationData,
                filterOptions: response.data.metadata?.filterOptions // Include filter options from backend
            };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch questions';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

// 5. Delete Question
export const deleteEngagementQuestion = (questionId) => async (dispatch) => {
    try {
        dispatch(setLoading(true));

        const response = await axiosInstance.delete(`/engagements/qna/${questionId}`);

        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Question deleted successfully!');
            
            dispatch({
                type: DELETE_ENGAGEMENT_QNA,
                payload: questionId
            });
            
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete question';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

// 6. Update Question
export const updateEngagementQuestion = (questionId, questionText) => async (dispatch) => {
    try {
        dispatch(setLoading(true));

        const response = await axiosInstance.put(`/engagements/qna/${questionId}`, {
            question: questionText
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Question updated successfully!');
            
            dispatch({
                type: UPDATE_ENGAGEMENT_QNA,
                payload: response.data.data
            });
            
            return { success: true, data: response.data.data };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update question';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

// 7. Get Question by ID (with vote count)
export const getEngagementQAQuestionById = (questionId) => async (dispatch) => {
    try {
        dispatch(setLoading(true));

        const response = await axiosInstance.get(`/engagements/qna/${questionId}`);

        if (response && response.status >= 200 && response.status < 300) {
            dispatch({
                type: ENGAGEMENT_QNA_BY_ID,
                payload: response.data.data
            });
            
            return { success: true, data: response.data.data };
        }
        return { success: false };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch question';
        toast.error(errorMessage);
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(setLoading(false));
    }
};

