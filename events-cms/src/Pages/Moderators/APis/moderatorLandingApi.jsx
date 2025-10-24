import axiosInstance from "../../../configs/axiosInstance";

// Set up authenticated axios instance
const setupAuthenticatedAxios = (token) => {
  const authenticatedAxios = axiosInstance;
  authenticatedAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  return authenticatedAxios;
};

// Fetch moderator landing data
export const fetchModeratorLandingData = async (moderatorId, sessionId, token) => {
  try {
    const authenticatedAxios = setupAuthenticatedAxios(token);
    let response;
    
    if (sessionId && !moderatorId) {
      // If we have sessionId but no moderatorId, use session-specific endpoint
      response = await authenticatedAxios.get(`/moderators/session/${sessionId}/landing`);
    } else if (moderatorId) {
      // If we have moderatorId, use moderator-specific endpoint
      const url = sessionId 
        ? `/engagements/moderator/${moderatorId}?sessionId=${sessionId}`
        : `/engagements/moderator/${moderatorId}`;
      response = await authenticatedAxios.get(url);
    } else {
      throw new Error('Either moderator ID or session ID is required');
    }
    
    return response.data;
  } catch (error) {
    console.error("Error fetching moderator landing data:", error);
    throw error;
  }
};

// Update question status (using existing engagement-qna API)
export const updateQuestionStatus = async (questionId, action, answer) => {
  try {
    if (action === 'answer') {
      // Use the existing answer endpoint
      const response = await axiosInstance.put(`/engagements/qna/${questionId}/answer`, {
        answer: answer || ''
      });
      return response.data;
    } else if (action === 'cancel') {
      // Use the existing update endpoint to set status to not_answered
      const response = await axiosInstance.put(`/engagements/qna/${questionId}`, {
        status: 'not_answered'
      });
      return response.data;
    }
  } catch (error) {
    console.error('Error updating question status:', error);
    throw error;
  }
};

// Update question (edit)
export const updateQuestion = async (questionId, updateData) => {
  try {
    const response = await axiosInstance.put(`/engagements/qna/${questionId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

// Delete question
export const deleteQuestion = async (questionId) => {
  try {
    const response = await axiosInstance.delete(`/engagements/qna/${questionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// Process session-specific response data
export const processSessionResponseData = (responseData) => {
  const { sessionDetails, moderators, questions: sessionQuestions } = responseData;
  
  // Set moderator data from the first moderator
  let moderatorData = null;
  if (moderators && moderators.length > 0) {
    const firstModerator = moderators[0];
    moderatorData = {
      id: firstModerator.id,
      name: firstModerator.fullName,
      email: firstModerator.email,
    };
  }

  // Set event data
  let eventData = null;
  if (sessionDetails.event) {
    eventData = {
      id: sessionDetails.event.id,
      title: sessionDetails.event.name,
      startDate: sessionDetails.event.startDate,
      endDate: sessionDetails.event.endDate,
    };
  }

  // Set engagement data
  const engagementData = {
    id: sessionDetails.track?.id || 'session-engagement',
    trackTitle: sessionDetails.track?.title || "General Track",
  };

  // Set session data
  const sessionData = {
    id: sessionDetails.id,
    title: sessionDetails.title,
    description: sessionDetails.description,
    startTime: sessionDetails.startTime,
    endTime: sessionDetails.endTime,
    questions: sessionQuestions?.questions || [],
    statistics: sessionQuestions?.summary || {
      questionsCount: 0,
      answeredQuestionsCount: 0,
      unansweredQuestionsCount: 0,
      pollsCount: 0,
      totalVotesCount: 0
    }
  };
  
  return {
    moderator: moderatorData,
    event: eventData,
    engagement: engagementData,
    sessions: [sessionData],
    selectedSession: sessionData,
    questions: sessionData.questions,
    answeringQuestions: sessionData.questions.filter(q => q.status === 'answering')
  };
};

// Process moderator-specific response data
export const processModeratorResponseData = (responseData, moderatorId, sessionId) => {
  const engagementData = responseData;
  
  // Set moderator data
  const moderatorData = {
    id: moderatorId,
    name: "Moderator",
    email: "moderator@example.com",
  };

  // Set event data
  let eventData = null;
  if (engagementData.track?.event) {
    eventData = {
      id: engagementData.track.event.id,
      title: engagementData.track.event.name,
      startDate: engagementData.track.event.startDate,
      endDate: engagementData.track.event.endDate,
    };
  }

  // Set engagement data
  const engagement = {
    id: engagementData.id,
    trackTitle: engagementData.track?.title || "General Track",
  };

  // Set sessions and questions
  const sessionsData = engagementData.track?.sessions || [];
  
  let selectedSession = null;
  let questions = [];
  let answeringQuestions = [];
  
  if (sessionsData.length > 0) {
    // If sessionId is provided in URL, find that specific session
    selectedSession = sessionsData[0]; // Default to first session
    if (sessionId) {
      const foundSession = sessionsData.find(s => s.id === sessionId);
      if (foundSession) {
        selectedSession = foundSession;
      }
    }
    
    questions = selectedSession.questions || [];
    answeringQuestions = questions.filter(q => q.status === 'answering');
  }
  
  return {
    moderator: moderatorData,
    event: eventData,
    engagement: engagement,
    sessions: sessionsData,
    selectedSession: selectedSession,
    questions: questions,
    answeringQuestions: answeringQuestions
  };
};
