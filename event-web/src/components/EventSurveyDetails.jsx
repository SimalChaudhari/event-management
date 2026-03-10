import { sanitizeHtml } from "../utils/sanitizeHtml";

/** Convert 24h time string (e.g. "14:50:00") to 12h format ("2:50 PM"). */
function to12h(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return "—";
  const trimmed = timeStr.trim();
  if (!trimmed) return "—";
  const parts = trimmed.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1] ? parseInt(parts[1], 10) : 0;
  if (Number.isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const mStr = Number.isNaN(m) ? "00" : String(m).padStart(2, "0");
  return `${h12}:${mStr} ${period}`;
}

/** Format date string (e.g. "2026-03-18" -> "18 Mar 2026"). */
function formatDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "—";
  const d = new Date(dateStr.trim());
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Reusable survey details component. Shows title, date/time range, isActive,
 * survey URLs, and sessions with a clear UI.
 *
 * @param {{ surveyDetails: { title?: string, startDate?: string, startTime?: string, endDate?: string, endTime?: string, isActive?: boolean, surveyUrls?: Array<{ title?: string, url?: string }>, sessions?: Array<{ id?: string, name?: string, date?: string, startTime?: string, endTime?: string, description?: string, isActive?: boolean, isFeedback?: boolean }> } | null }} props
 */
export default function EventSurveyDetails({ surveyDetails }) {
  if (!surveyDetails) {
    return (
      <div className="p-5 sm:p-6">
        <p className="text-slate-500 text-sm">No survey available.</p>
      </div>
    );
  }

  const {
    title,
    startDate,
    startTime,
    endDate,
    endTime,
    isActive,
    surveyUrls = [],
    sessions = [],
  } = surveyDetails;

  const hasUrls = surveyUrls.length > 0;
  const hasSessions = sessions.length > 0;

  return (
    <div className="p-5 sm:p-6">
      {/* Header: title + active badge */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {title || "Survey"}
        </h2>
        {isActive != null && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              isActive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        )}
      </div>

      {/* Date & time range – same row style as detail page */}
      {(startDate || endDate || startTime || endTime) && (
        <div className="mb-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Survey period
          </p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="space-y-0">
              {(startDate || startTime) && (
                <div className="flex items-center justify-between gap-4 py-2.5 px-4 border-b border-slate-200 last:border-b-0">
                  <span className="text-sm text-blue-600 font-medium shrink-0">
                    Start:
                  </span>
                  <span className="text-sm text-slate-800 text-right">
                    {formatDate(startDate)}
                    {startTime && <span className="text-slate-600 ml-1">{to12h(startTime)}</span>}
                  </span>
                </div>
              )}
              {(endDate || endTime) && (
                <div className="flex items-center justify-between gap-4 py-2.5 px-4 border-b border-slate-200 last:border-b-0">
                  <span className="text-sm text-blue-600 font-medium shrink-0">
                    End:
                  </span>
                  <span className="text-sm text-slate-800 text-right">
                    {formatDate(endDate)}
                    {endTime && <span className="text-slate-600 ml-1">{to12h(endTime)}</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Survey links */}
      {hasUrls && (
        <section className="mb-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Survey links
          </p>
          <div className="space-y-2">
            {surveyUrls.map((item, i) => (
              <div
                key={item.url || i}
                className="flex items-center justify-between gap-4 py-2.5 px-4 rounded-xl border border-slate-200 bg-white"
              >
                <span className="text-sm text-slate-800 font-medium truncate min-w-0">
                  {item.title || item.url || "Survey link"}
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 font-medium hover:underline shrink-0 inline-flex items-center gap-1.5"
                >
                  Open
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sessions – same section label and session dl style as SpeakerCard */}
      {hasSessions && (
        <section>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Sessions
          </p>
          <div className="space-y-4">
            {sessions.map((session, i) => (
              <div
                key={session.id || i}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-l-primary/50"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-slate-800">
                    {session.name || `Session ${i + 1}`}
                  </h3>
                  {session.isActive != null && (
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        session.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {session.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                  {session.isFeedback === true && (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
                      Feedback
                    </span>
                  )}
                </div>
                <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  {session.date && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 shrink-0">Date</span>
                      <span className="text-slate-700 font-medium">{formatDate(session.date)}</span>
                    </div>
                  )}
                  {(session.startTime || session.endTime) && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 shrink-0">Time</span>
                      <span className="text-slate-700 font-medium">
                        {session.startTime && to12h(session.startTime)}
                        {session.startTime && session.endTime && " – "}
                        {session.endTime && to12h(session.endTime)}
                      </span>
                    </div>
                  )}
                </dl>
                {session.description && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Description
                    </p>
                    <div
                      className="text-sm text-slate-700 prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(session.description),
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!hasUrls && !hasSessions && (
        <p className="text-slate-500 text-sm">No survey links or sessions.</p>
      )}
    </div>
  );
}
