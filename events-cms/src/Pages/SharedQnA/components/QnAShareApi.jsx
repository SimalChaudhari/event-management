import { API_URL } from '../../../configs/env';

// Answer question via share link (public, no auth)
export const answerQuestionViaShareLink = async (shareToken, questionId, answer) => {
  try {
    const response = await fetch(`${API_URL}/api/engagements/qna/share/${shareToken}/answer/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error answering question:', error);
    throw error;
  }
};

// Update question via share link (public, no auth)
export const updateQuestionViaShareLink = async (shareToken, questionId, updateData) => {
  try {
    const response = await fetch(`${API_URL}/api/engagements/qna/share/${shareToken}/question/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

// Delete question via share link (public, no auth)
export const deleteQuestionViaShareLink = async (shareToken, questionId) => {
  try {
    const response = await fetch(`${API_URL}/api/engagements/qna/share/${shareToken}/question/${questionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// Generate question share link (public, no auth)
export const generateQuestionShareLink = async (questionId) => {
  try {
    const response = await fetch(`${API_URL}/api/engagements/qna/generate-question-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questionId }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating question share link:', error);
    throw error;
  }
};

