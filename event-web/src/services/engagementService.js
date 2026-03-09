import axiosInstance from '../config/axiosInstance';

/**
 * Engagement APIs (Q&A, polling, surveys).
 * Backend: GET api/engagements/event/:eventId (public), api/engagements/qna/* (Q&A).
 * Polling: api/events/polls/*. Surveys: api/events/surveys/* (not yet used here).
 */
export const engagementService = {
  getByEvent(eventId) {
    return axiosInstance.get(`/engagements/event/${eventId}`).then((r) => r.data?.data ?? []);
  },

  getQnAQuestions(opts) {
    const params = new URLSearchParams();
    if (opts.engagementId) params.set('engagementId', opts.engagementId);
    if (opts.sessionId) params.set('sessionId', opts.sessionId);
    if (opts.page) params.set('page', String(opts.page));
    if (opts.limit) params.set('limit', String(opts.limit));
    return axiosInstance
      .get(`/engagements/qna/questions?${params.toString()}`)
      .then((r) => r.data?.data ?? []);
  },

  createQnAQuestion(payload) {
    return axiosInstance.post('/engagements/qna', {
      engagementId: payload.engagementId,
      sessionId: payload.sessionId,
      question: payload.questionText || payload.question,
    }).then((r) => r.data);
  },
};
