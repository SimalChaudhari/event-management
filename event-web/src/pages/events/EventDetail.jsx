import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../routes/routeConfig';
import { getEventById } from '../../services/eventService';
import { engagementService } from '../../services/engagementService';

export default function EventDetail() {
  const { id } = useParams();
  const { authenticated, authUser } = useSelector((s) => s.auth);
  const [event, setEvent] = useState(null);
  const [eventError, setEventError] = useState('');
  const [engagements, setEngagements] = useState([]);
  const [qnaQuestions, setQnaQuestions] = useState([]);
  const [qnaLoading, setQnaLoading] = useState(false);
  const [engagementLoading, setEngagementLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({ text: '', sessionId: '' });
  const [submitQnaLoading, setSubmitQnaLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getEventById(id)
      .then((data) => {
        setEvent(data);
        setEventError('');
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setEventError('Log in to see full event details.');
        } else {
          setEventError(err.response?.data?.message || 'Failed to load event.');
        }
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    engagementService.getByEvent(id).then((list) => {
      setEngagements(Array.isArray(list) ? list : []);
      setEngagementLoading(false);
    }).catch(() => setEngagementLoading(false));
  }, [id]);

  const firstSessionId = engagements.length > 0 && engagements[0].sessionIds?.length > 0
    ? engagements[0].sessionIds[0]
    : engagements[0]?.track?.sessions?.[0]?.id;
  const firstEngagementId = engagements[0]?.id;

  useEffect(() => {
    if (!firstSessionId && !firstEngagementId) return;
    setQnaLoading(true);
    engagementService
      .getQnAQuestions(firstSessionId ? { sessionId: firstSessionId } : { engagementId: firstEngagementId })
      .then((data) => setQnaQuestions(Array.isArray(data) ? data : []))
      .catch(() => setQnaQuestions([]))
      .finally(() => setQnaLoading(false));
  }, [firstSessionId, firstEngagementId]);

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    if (!authenticated || !newQuestion.text.trim() || !firstEngagementId) return;
    const sessionId = newQuestion.sessionId || firstSessionId;
    if (!sessionId) return;
    setSubmitQnaLoading(true);
    engagementService
      .createQnAQuestion({
        engagementId: firstEngagementId,
        sessionId,
        questionText: newQuestion.text.trim(),
      })
      .then(() => {
        setNewQuestion({ text: '', sessionId: '' });
        return engagementService.getQnAQuestions(sessionId ? { sessionId } : { engagementId: firstEngagementId });
      })
      .then((data) => setQnaQuestions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setSubmitQnaLoading(false));
  };

  return (
    <div className="py-6 px-4 max-w-2xl mx-auto">
      <Link to={ROUTES.HOME} className="text-sm font-medium text-primary hover:underline mb-4 inline-block">← Back to Home</Link>

      {eventError && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
          {eventError}
          {!authenticated && (
            <span className="ml-2">
              <Link to={ROUTES.LOGIN} className="font-medium underline">Log in</Link>
            </span>
          )}
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {event?.name || event?.title || `Event`}
      </h1>
      {event?.description && (
        <p className="text-slate-600 text-sm mb-6 line-clamp-3">{event.description}</p>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Engagements</h2>
        {engagementLoading && <p className="text-slate-500 text-sm">Loading…</p>}
        {!engagementLoading && engagements.length === 0 && (
          <p className="text-slate-500 text-sm">No engagements for this event yet.</p>
        )}
        {!engagementLoading && engagements.length > 0 && (
          <ul className="space-y-2">
            {engagements.map((eng) => (
              <li key={eng.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-medium text-slate-800">{eng.track?.name || 'Session'}</span>
                {eng.track?.sessions?.length > 0 && (
                  <ul className="mt-1 text-sm text-slate-600">
                    {eng.track.sessions.slice(0, 5).map((s) => (
                      <li key={s.id}>• {s.name || s.title || 'Session'}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Q&A</h2>
        {qnaLoading && <p className="text-slate-500 text-sm">Loading questions…</p>}
        {!qnaLoading && (
          <>
            <ul className="space-y-2 mb-4">
              {qnaQuestions.length === 0 && <li className="text-slate-500 text-sm">No questions yet.</li>}
              {qnaQuestions.map((q) => (
                <li key={q.id} className="p-3 rounded-lg border border-slate-200 bg-white text-sm">
                  <p className="text-slate-800">{q.question || q.questionText || q.text}</p>
                  {q.answer && <p className="mt-1 text-slate-600">A: {q.answer}</p>}
                </li>
              ))}
            </ul>
            {authenticated && (
              <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-2">
                <textarea
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion((p) => ({ ...p, text: e.target.value }))}
                  placeholder="Ask a question…"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={submitQnaLoading || !newQuestion.text.trim()}
                  className="self-end px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitQnaLoading ? 'Submitting…' : 'Submit question'}
                </button>
              </form>
            )}
            {!authenticated && (
              <p className="text-slate-500 text-sm">
                <Link to={ROUTES.LOGIN} className="text-primary font-medium">Log in</Link> to ask a question.
              </p>
            )}
          </>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Polling &amp; surveys</h2>
        <p className="text-slate-600 text-sm">
          Live polling and surveys may be available during the event. Check the session links above or use the Evential app for the best experience.
        </p>
      </section>
    </div>
  );
}
