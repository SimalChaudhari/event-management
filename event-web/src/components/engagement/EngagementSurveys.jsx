import { useState, useEffect } from 'react';
import { engagementService } from '../../services/engagementService';
import { toast } from 'react-toastify';

const QUESTION_TYPES = {
  text: 'text',
  textarea: 'textarea',
  radio: 'radio',
  checkbox: 'checkbox',
  rating: 'rating',
};

/**
 * Surveys for an event. Uses only surveyDetails from event (register-events) — no getSurveysCurrent or other list API.
 */
export default function EngagementSurveys({ eventId, surveyDetails }) {
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [detail, setDetail] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState(null);

  const surveysForEvent =
    surveyDetails && surveyDetails.id
      ? [{ ...surveyDetails, id: surveyDetails.id, title: surveyDetails.title ?? surveyDetails.name }]
      : [];

  const openSurvey = (survey) => {
    setSelectedSurvey(survey);
    setDetail(null);
    setQuestions([]);
    setAnswers({});
    setSummary(null);
    engagementService
      .getSurveyDetail(survey.id)
      .then((data) => setDetail(data))
      .catch(() => toast.error('Failed to load survey'));
    engagementService
      .getSurveyQuestions(survey.id)
      .then((list) => setQuestions(Array.isArray(list) ? list : []))
      .catch(() => setQuestions([]));
    engagementService
      .getUserSurveySummary(survey.id)
      .then((data) => setSummary(data))
      .catch(() => setSummary(null));
  };

  const closeSurvey = () => {
    setSelectedSurvey(null);
    setDetail(null);
    setQuestions([]);
    setAnswers({});
    setSummary(null);
  };

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const getSessionId = () => {
    const sessions = detail?.sessions;
    if (!sessions) return null;
    const arr = Array.isArray(sessions) ? sessions : [sessions];
    return arr[0]?.id ?? null;
  };

  const handleSubmitSurvey = () => {
    if (!selectedSurvey || !questions.length) return;
    const sessionId = getSessionId();
    if (!sessionId) {
      toast.error('No session found for this survey');
      return;
    }
    const answerList = questions.map((q) => {
      const v = answers[q.id];
      if (q.questionType === 'rating' && v != null) return { questionId: q.id, ratingAnswer: Number(v) };
      if (q.questionType === 'radio' && v != null) return { questionId: q.id, selectedOptions: [v] };
      if (q.questionType === 'checkbox' && Array.isArray(v)) return { questionId: q.id, selectedOptions: v };
      if ((q.questionType === 'text' || q.questionType === 'textarea') && v != null) return { questionId: q.id, textAnswer: String(v) };
      return { questionId: q.id };
    });
    setSubmitting(true);
    engagementService
      .submitSurveyAnswersBulk(selectedSurvey.id, sessionId, answerList, false)
      .then(() => {
        toast.success('Survey submitted');
        setSummary({ submitted: true });
        setAnswers({});
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to submit survey'))
      .finally(() => setSubmitting(false));
  };

  if (selectedSurvey) {
    const sessionId = getSessionId();
    const alreadySubmitted = summary?.submitted || summary?.isAnswered;

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{selectedSurvey.title}</h3>
            {detail?.eventInfo?.name && (
              <p className="text-slate-500 text-sm mt-0.5">{detail.eventInfo.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={closeSurvey}
            className="text-slate-500 hover:text-slate-700 text-sm"
          >
            ← Back
          </button>
        </div>

        {alreadySubmitted ? (
          <p className="text-green-600 text-sm py-4">You have already submitted this survey. Thank you!</p>
        ) : (
          <>
            <div className="space-y-5">
              {questions.map((q) => (
                <div key={q.id} className="border-b border-slate-100 pb-4">
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    {q.questionName}
                    {q.isRequired && <span className="text-red-500"> *</span>}
                  </label>
                  {q.questionType === QUESTION_TYPES.text && (
                    <input
                      type="text"
                      value={answers[q.id] ?? ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  )}
                  {q.questionType === QUESTION_TYPES.textarea && (
                    <textarea
                      value={answers[q.id] ?? ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  )}
                  {q.questionType === QUESTION_TYPES.radio && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt, i) => (
                        <label key={i} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={(answers[q.id] ?? '') === opt}
                            onChange={() => setAnswer(q.id, opt)}
                          />
                          <span className="text-sm text-slate-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.questionType === QUESTION_TYPES.rating && (
                    <div className="flex gap-2 flex-wrap">
                      {Array.from({ length: (q.maxRating || 5) - (q.minRating || 1) + 1 }, (_, i) => (q.minRating || 1) + i).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAnswer(q.id, n)}
                          className={`w-9 h-9 rounded-full text-sm font-medium ${
                            answers[q.id] === n ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {questions.length > 0 && sessionId && (
              <button
                type="button"
                onClick={handleSubmitSurvey}
                disabled={submitting}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit survey'}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  if (surveysForEvent.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-slate-500 text-sm">No survey data for this event.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {surveysForEvent.map((survey) => (
        <div
          key={survey.id}
          className="rounded-lg border border-slate-200 bg-white p-4 flex justify-between items-center"
        >
          <div>
            <p className="font-medium text-slate-800">{survey.title}</p>
            {survey.event?.name && (
              <p className="text-slate-500 text-sm">{survey.event.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => openSurvey(survey)}
            className="rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium hover:bg-primary/20"
          >
            Take survey
          </button>
        </div>
      ))}
    </div>
  );
}
