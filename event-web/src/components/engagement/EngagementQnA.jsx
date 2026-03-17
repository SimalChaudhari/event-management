import { useState, useEffect } from "react";
import { engagementService } from "../../services/engagementService";
import { toast } from "react-toastify";

/** Human-readable status label. */
function getStatusLabel(status) {
  if (!status) return "Pending";
  const s = String(status).toLowerCase();
  if (s === "answered") return "Answered";
  if (s === "not_answered") return "Pending";
  if (s === "approved") return "Approved";
  return status;
}

/** Format date for display: relative (e.g. "2h ago") or short absolute. */
function formatQuestionTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Q&A section for one engagement session.
 * Uses initialQuestions from event (register-events) only — no getQnAQuestions API on load.
 * @param {string} engagementId
 * @param {string} sessionId
 * @param {string} sessionTitle
 * @param {boolean} disabled - when Q&A is disabled for this session
 * @param {Array} initialQuestions - optional; from event data (no extra API)
 */
export default function EngagementQnA({
  engagementId,
  sessionId,
  sessionTitle,
  disabled,
  initialQuestions = [],
}) {
  const [questions, setQuestions] = useState(Array.isArray(initialQuestions) ? initialQuestions : []);
  const [submitting, setSubmitting] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [likingId, setLikingId] = useState(null);

  useEffect(() => {
    setQuestions(Array.isArray(initialQuestions) ? initialQuestions : []);
  }, [engagementId, sessionId, initialQuestions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = questionText?.trim();
    if (!text) return;
    setSubmitting(true);
    engagementService
      .createQnAQuestion({
        engagementId,
        sessionId,
        question: text,
      })
      .then((res) => {
        setQuestionText("");
        toast.success("Question submitted");
        const created = res?.data;
        if (created?.id) {
          setQuestions((prev) => [
            {
              id: created.id,
              question: text,
              status: "not_answered",
              likesCount: 0,
              userLiked: false,
              isMyQuestion: true,
              createdAt: new Date().toISOString(),
              askedBy: null,
            },
            ...prev,
          ]);
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to submit question");
      })
      .finally(() => setSubmitting(false));
  };

  const handleLike = (questionId) => {
    if (likingId) return;
    const q = questions.find((x) => x.id === questionId);
    const wasLiked = q?.userLiked;
    setLikingId(questionId);
    engagementService
      .likeQnAQuestion(questionId)
      .then((res) => {
        const newCount =
          res?.data?.likesCount ??
          (wasLiked ? (q.likesCount || 0) - 1 : (q.likesCount || 0) + 1);
        const updated = questions.map((item) =>
          item.id === questionId
            ? {
                ...item,
                likesCount: Math.max(0, newCount),
                userLiked: !wasLiked,
              }
            : item,
        );
        setQuestions(updated);
      })
      .catch(() => toast.error("Could not update like"))
      .finally(() => setLikingId(null));
  };

  if (disabled) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-500 text-sm">
        Q&A is not available for this session.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-800">
        {sessionTitle || "Q&A"}
      </h3>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          maxLength={500}
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !questionText?.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Ask"}
        </button>
      </form>

      {questions.length === 0 ? (
        <p className="text-slate-500 text-sm py-4">
          No questions yet. Be the first to ask!
        </p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => {
            const askedBy = q.askedBy
              ? q.askedBy.fullName ||
                [q.askedBy.firstName, q.askedBy.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                q.askedBy.email
              : null;
            const isAnswered =
              q.status === "answered" || q.isAnswered || !!q.answer;
            const isApproved = q.status === "approved";
            const statusLabel = isApproved
              ? "Approved"
              : isAnswered
                ? "Answered"
                : getStatusLabel(q.status);
            const statusClass = isApproved
              ? "bg-indigo-200 text-indigo-900 border border-indigo-300"
              : isAnswered
                ? "bg-emerald-200 text-emerald-900 border border-emerald-300"
                : "bg-amber-200 text-amber-900 border border-amber-300";
            const hasLiked = q.userLiked === true;
            return (
              <li
                key={q.id}
                className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
              >
                <p className="text-slate-800 font-medium">{q.question}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                  {q.createdAt && (
                    <span title={new Date(q.createdAt).toLocaleString()}>
                      Asked {formatQuestionTime(q.createdAt)}
                    </span>
                  )}
                  {/* Your question: show "You" only. Other users: show their name. */}
                  {q.isMyQuestion ? (
                    <span className="text-primary font-medium">· You</span>
                  ) : askedBy ? (
                    <span>· {askedBy}</span>
                  ) : null}
                </div>
                {q.answer && (
                  <>
                    <p className="mt-2 pl-3 border-l-2 border-primary/30 text-slate-600">
                      {q.answer}
                    </p>
                    {q.answeredAt && (
                      <p className="mt-1 text-xs text-slate-500 pl-3">
                        Answered {formatQuestionTime(q.answeredAt)}
                      </p>
                    )}
                  </>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleLike(q.id)}
                    disabled={likingId === q.id}
                    className={`flex items-center gap-1 disabled:opacity-50 ${
                      hasLiked
                        ? "text-red-600 hover:text-red-700"
                        : "text-slate-400 hover:text-slate-500"
                    }`}
                    aria-label={hasLiked ? "Unlike question" : "Like question"}
                  >
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill={hasLiked ? "#dc2626" : "none"}
                      stroke={hasLiked ? "#dc2626" : "currentColor"}
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>

                    <span className="text-slate-500 text-xs">
                      {q.likesCount ?? 0}
                    </span>
                    <span className="text-slate-500 text-xs"> likes</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
