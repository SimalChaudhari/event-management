import publicAxiosInstance from '../../../configs/publicAxiosInstance';

/**
 * Answer a question via share link (Public API - No authentication required)
 * 
 * @param {string} shareToken - The share token for the session/track
 * @param {string} questionId - The ID of the question to answer
 * @param {string} answer - The answer text for the question
 * @returns {Promise<Object>} Response object with success status and data
 * @throws {Error} If the API request fails
 */
export const answerQuestionViaShareLink = async (shareToken, questionId, answer) => {
  try {
    const response = await publicAxiosInstance.put(
      `/engagements/qna/share/${shareToken}/answer/${questionId}`,
      { answer }
    );
    return response.data;
  } catch (error) {
    console.error('Error answering question:', error);
    throw error;
  }
};

/**
 * Update a question via share link (Public API - No authentication required)
 * 
 * @param {string} shareToken - The share token for the session/track
 * @param {string} questionId - The ID of the question to update
 * @param {Object} updateData - The data to update (question text, status, etc.)
 * @returns {Promise<Object>} Response object with success status and updated question data
 * @throws {Error} If the API request fails
 */
export const updateQuestionViaShareLink = async (shareToken, questionId, updateData) => {
  try {
    const response = await publicAxiosInstance.put(
      `/engagements/qna/share/${shareToken}/question/${questionId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

/**
 * Delete a question via share link (Public API - No authentication required)
 * 
 * @param {string} shareToken - The share token for the session/track
 * @param {string} questionId - The ID of the question to delete
 * @returns {Promise<Object>} Response object with success status and message
 * @throws {Error} If the API request fails
 */
export const deleteQuestionViaShareLink = async (shareToken, questionId) => {
  try {
    const response = await publicAxiosInstance.delete(
      `/engagements/qna/share/${shareToken}/question/${questionId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

/**
 * Generate a shareable link for an individual question (Public API - No authentication required)
 * 
 * @param {string} questionId - The ID of the question to generate a share link for
 * @returns {Promise<Object>} Response object with success status and share URL data
 * @throws {Error} If the API request fails
 */
export const generateQuestionShareLink = async (questionId) => {
  try {
    const response = await publicAxiosInstance.post(
      '/engagements/qna/generate-question-link',
      { questionId }
    );
    return response.data;
  } catch (error) {
    console.error('Error generating question share link:', error);
    throw error;
  }
};

/**
 * Get session Q&A data by share link (Public API - No authentication required)
 * 
 * @param {string} shareToken - The share token for the session
 * @returns {Promise<Object>} Response object with success status, event, track, session, and questions data
 * @throws {Error} If the API request fails
 */
export const getSessionQnaByShareLink = async (shareToken) => {
  try {
    const response = await publicAxiosInstance.get(
      `/engagements/qna/share/${shareToken}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching session Q&A by share link:', error);
    throw error;
  }
};

/**
 * Get track Q&A data by share link (Public API - No authentication required)
 * Returns paginated sessions within the track along with their questions
 * 
 * @param {string} shareToken - The share token for the track
 * @param {number} [page=1] - The page number to retrieve (default: 1)
 * @param {number} [pageSize=1] - The number of sessions per page (default: 1)
 * @returns {Promise<Object>} Response object with success status, event, track, sessions, questions data, and pagination info
 * @throws {Error} If the API request fails
 */
export const getTrackQnaByShareLink = async (shareToken, page = 1, pageSize = 1) => {
  try {
    const response = await publicAxiosInstance.get(
      `/engagements/qna/track/${shareToken}`,
      {
        params: {
          page,
          pageSize,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching track Q&A by share link:', error);
    throw error;
  }
};

