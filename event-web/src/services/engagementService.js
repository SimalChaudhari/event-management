import axiosInstance from '../config/axiosInstance';

/**
 * Engagement APIs: Q&A, polling, surveys.
 * - Engagements: api/engagements/event/:eventId
 * - Q&A: api/engagements/qna/questions, POST /engagements/qna, POST /engagements/qna/like
 * - Polling: api/events/polls/session/:eventId/:speakerId, POST session/submit-answer
 * - Surveys: api/events/surveys/current, detail/:surveyId, questions/survey/:surveyId, answers/bulk
 */
export const engagementService = {
  /** Get engagements for an event (tracks + sessions with Q&A and polling info). */
  getByEvent(eventId) {
    return axiosInstance
      .get(`/engagements/event/${eventId}`)
      .then((r) => r.data?.data ?? r.data ?? null);
  },

  // —— Q&A —————————————————————————————————————————————————————————————————
  getQnAQuestions(opts = {}) {
    const params = new URLSearchParams();
    if (opts.engagementId) params.set('engagementId', opts.engagementId);
    if (opts.sessionId) params.set('sessionId', opts.sessionId);
    if (opts.page != null) params.set('page', String(opts.page));
    if (opts.limit != null) params.set('limit', String(opts.limit));
    if (opts.status) params.set('status', opts.status);
    if (opts.sortBy) params.set('sortBy', opts.sortBy);
    const qs = params.toString();
    return axiosInstance
      .get(`/engagements/qna/questions${qs ? `?${qs}` : ''}`)
      .then((r) => (Array.isArray(r.data?.data) ? r.data.data : r.data?.data?.questions ?? []));
  },

  createQnAQuestion(payload) {
    return axiosInstance
      .post('/engagements/qna', {
        engagementId: payload.engagementId,
        sessionId: payload.sessionId,
        question: payload.questionText || payload.question,
      })
      .then((r) => r.data);
  },

  likeQnAQuestion(questionId) {
    return axiosInstance
      .post('/engagements/qna/like', { questionId })
      .then((r) => r.data);
  },

  // —— Polling ——————————————————————————————————————————————————————————————
  /** Get or create poll session for event + speaker. Returns current question or completion state. */
  getPollSession(eventId, speakerId) {
    return axiosInstance
      .get(`/events/polls/session/${eventId}/${speakerId}`)
      .then((r) => r.data?.data ?? r.data);
  },

  submitPollAnswer(eventId, speakerId, pollId, optionId) {
    return axiosInstance
      .post(`/events/polls/session/submit-answer/${eventId}/${speakerId}`, {
        pollId,
        optionId,
      })
      .then((r) => r.data?.data ?? r.data);
  },

  // —— Surveys —————————————————————————————————————————————————────────—————
  /** List surveys (with sessions). Filter by eventId on client if needed. */
  getSurveysCurrent(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return axiosInstance
      .get(`/events/surveys/current${qs ? `?${qs}` : ''}`)
      .then((r) => r.data?.data ?? []);
  },

  getSurveyDetail(surveyId) {
    return axiosInstance
      .get(`/events/surveys/detail/${surveyId}`)
      .then((r) => r.data?.data ?? r.data);
  },

  getSurveyQuestions(surveyId) {
    return axiosInstance
      .get(`/events/surveys/questions/survey/${surveyId}`)
      .then((r) => r.data?.data ?? []);
  },

  submitSurveyAnswersBulk(surveyId, sessionId, answers, isDraft = false) {
    return axiosInstance
      .post('/events/surveys/answers/bulk', {
        surveyId,
        sessionId,
        answers,
        isDraft,
      })
      .then((r) => r.data?.data ?? r.data);
  },

  getUserSurveySummary(surveyId) {
    return axiosInstance
      .get(`/events/surveys/answers/survey/${surveyId}/user/summary`)
      .then((r) => r.data?.data ?? r.data);
  },

  submitSurveyFeedback(surveyId, payload) {
    return axiosInstance
      .post(`/events/surveys/feedback/${surveyId}`, payload)
      .then((r) => r.data);
  },
};
