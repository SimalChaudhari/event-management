import { useState, useEffect } from 'react';
import { engagementService } from '../../services/engagementService';
import { toast } from 'react-toastify';

/**
 * Polling section for an event. Uses initialPollByKey from event (register-events) only — no getPollSession API on load.
 * @param {string} eventId
 * @param {Array} sessions - from engagements (track.sessions with speakers)
 * @param {Object} pollingLink - optional { title, url } from session for external polling
 * @param {Object} initialPollByKey - optional; poll data keyed by session-speaker key (from event data)
 */
export default function EngagementPolling({ eventId, sessions = [], pollingLink, initialPollByKey = {} }) {
  const [pollByKey, setPollByKey] = useState(() => initialPollByKey || {});
  const [submittingKey, setSubmittingKey] = useState(null);

  useEffect(() => {
    if (initialPollByKey && typeof initialPollByKey === 'object') {
      setPollByKey(initialPollByKey);
    }
  }, [eventId, initialPollByKey]);

  const sessionSpeakerKeys = [];
  sessions.forEach((session) => {
    if (!session.enablePolling) return;
    const speakers = session.speakers || [];
    if (speakers.length === 0) {
      sessionSpeakerKeys.push({ session, speakerId: null, key: `${session.id}-none` });
    } else {
      speakers.forEach((sp) => {
        sessionSpeakerKeys.push({
          session,
          speakerId: sp.id,
          speakerName: sp.name || `${sp.firstName || ''} ${sp.lastName || ''}`.trim(),
          key: `${session.id}-${sp.id}`,
        });
      });
    }
  });

  const hasPollContent =
    pollingLink?.url ||
    sessionSpeakerKeys.some(({ key }) => {
      const d = pollByKey[key];
      const current = d?.currentQuestion || d?.currentPoll;
      const results = d?.results;
      return d && (current != null || (Array.isArray(results) && results.length > 0));
    });

  if (!hasPollContent) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-slate-500 text-sm">No polling data for this event.</p>
      </div>
    );
  }

  const handleVote = (key, speakerId, pollId, optionId) => {
    if (submittingKey) return;
    setSubmittingKey(key);
    engagementService
      .submitPollAnswer(eventId, speakerId, pollId, optionId)
      .then((data) => {
        setPollByKey((prev) => ({ ...prev, [key]: data }));
        toast.success('Vote submitted');
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to submit vote');
      })
      .finally(() => setSubmittingKey(null));
  };

  return (
    <div className="space-y-6">
      {pollingLink?.url && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-slate-700">{pollingLink.title || 'Live polling'}</p>
          <a
            href={pollingLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm font-medium hover:underline mt-1 inline-block"
          >
            Open polling →
          </a>
        </div>
      )}

      {sessionSpeakerKeys.map(({ key, session, speakerId, speakerName }) => {
        if (speakerId == null) return null;
        const pollData = pollByKey[key];
        const isCompleted = pollData?.isCompleted === true;
        const currentPoll = pollData?.currentQuestion || pollData?.currentPoll;
        const options = currentPoll?.options || [];
        const results = pollData?.results;

        if (!pollData || (currentPoll == null && !results)) {
          return null;
        }

        return (
          <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">
              {session.title}
              {speakerName && ` · ${speakerName}`}
            </p>
            {isCompleted && Array.isArray(results) && results.length > 0 ? (
              <div className="mt-3 space-y-4">
                <p className="text-slate-600 text-sm">Poll completed. Results:</p>
                {results.map((r, i) => (
                  <div key={i} className="border-b border-slate-100 pb-2 last:border-0">
                    <p className="text-slate-800 text-sm font-medium">{r.question}</p>
                    {(r.options || []).map((opt, j) => (
                      <div key={j} className="flex justify-between text-sm text-slate-600 mt-1 pl-2">
                        <span>{opt.optionText}</span>
                        <span>{opt.voteCount ?? 0} votes</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : currentPoll ? (
              <div className="mt-3">
                <p className="text-slate-700 text-sm mb-2">{currentPoll.question || currentPoll.questionName}</p>
                <div className="space-y-2">
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleVote(key, speakerId, currentPoll.id, opt.id)}
                      disabled={!!submittingKey}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                    >
                      {opt.optionText}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
