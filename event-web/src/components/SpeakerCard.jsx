import { UPLOADS_URL } from '../config';
import { sanitizeHtml } from '../utils/sanitizeHtml';

/** Convert 24h time string (e.g. "14:50:00") to 12h format ("2:50 PM"). Returns original if not parseable. */
function to12h(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return timeStr;
  const trimmed = timeStr.trim();
  if (!trimmed) return timeStr;
  const parts = trimmed.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] ? parseInt(parts[1], 10) : 0;
  if (Number.isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const mStr = Number.isNaN(m) ? '00' : String(m).padStart(2, '0');
  return `${h12}:${mStr} ${period}`;
}

/** Format date string for display (e.g. "2026-03-18" -> "18 Mar 2026") */
function formatDateStr(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const d = new Date(dateStr.trim());
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SpeakerCard({ speaker, uploadsUrl = UPLOADS_URL, onImageClick }) {
  const imgSrc = speaker?.profilePicture || speaker?.image;
  const photoUrl = imgSrc
    ? (String(imgSrc).startsWith('http') ? imgSrc : `${uploadsUrl}/${imgSrc}`)
    : null;
  const displayName =
    speaker?.name ||
    [speaker?.firstName, speaker?.lastName].filter(Boolean).join(' ') ||
    '—';
  const orDash = (v) =>
    v != null && String(v).trim() !== '' ? String(v).trim() : '—';

  const from = orDash(speaker?.speakingStartTime);
  const to = orDash(speaker?.speakingEndTime);
  const from12 = from !== '—' ? to12h(from) : '—';
  const to12 = to !== '—' ? to12h(to) : '—';
  const speakingTimeStr =
    from12 !== '—' && to12 !== '—' ? `${from12} - ${to12}` : from12 !== '—' ? from12 : to12 !== '—' ? to12 : '—';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/30 overflow-hidden">
      {/* Profile: photo + name, position, company */}
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {photoUrl ? (
          onImageClick ? (
            <button
              type="button"
              onClick={() => onImageClick(photoUrl, displayName)}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <img
                src={photoUrl}
                alt={displayName}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
            </button>
          ) : (
            <img
              src={photoUrl}
              alt={displayName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shrink-0"
            />
          )
        ) : (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-semibold shrink-0">
            {(displayName !== '—' ? displayName : '?').slice(0, 1)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900">{displayName}</h3>
          <p className="text-sm font-medium text-primary mt-0.5">
            {orDash(speaker?.position || speaker?.designation)}
          </p>
          <p className="text-sm text-slate-600 mt-0.5">
            {orDash(speaker?.companyName)}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Speaking time: {speakingTimeStr}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {orDash(speaker?.email) !== '—' && (
              <a href={`mailto:${speaker.email}`} className="text-primary hover:underline truncate max-w-[200px] sm:max-w-none">
                {speaker.email}
              </a>
            )}
            {orDash(speaker?.mobile || speaker?.mobileNumber || speaker?.phone) !== '—' && (
              <a href={`tel:${speaker?.mobile || speaker?.mobileNumber || speaker?.phone}`} className="text-primary hover:underline">
                {speaker?.mobile || speaker?.mobileNumber || speaker?.phone}
              </a>
            )}
          </div>
        </div>
      </div>
      {/* Below profile: About, Sessions */}
      <div className="px-4 pb-4 pt-0 border-t border-slate-200">
        <div className="pt-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            About
          </p>
          {(speaker?.description || speaker?.bio) &&
          String(speaker?.description || speaker?.bio).trim() !== '' ? (
            <div
              className="text-sm text-slate-700 prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(speaker?.description || speaker?.bio || ''),
              }}
            />
          ) : (
            <p className="text-sm text-slate-500">—</p>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Sessions
          </p>
          {speaker?.speakingSessions?.length > 0 ? (
            <ul className="space-y-3">
              {speaker.speakingSessions.map((session, i) => {
                const title = session?.sessionTitle || session?.title || session?.name || `Session ${i + 1}`;
                const date = formatDateStr(session?.sessionDate);
                const start = session?.startTime ? to12h(session.startTime) : '—';
                const end = session?.endTime ? to12h(session.endTime) : '—';
                const timeStr = start !== '—' && end !== '—' ? `${start} – ${end}` : start !== '—' ? start : end !== '—' ? end : '—';
                const venue = orDash(session?.venue);
                const track = orDash(session?.trackTitle);
                return (
                  <li
                    key={session?.sessionId || session?.id || i}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm border-l-4 border-l-primary/50"
                  >
                    <p className="font-semibold text-slate-800">{title}</p>
                    {track !== '—' && (
                      <p className="text-xs text-primary font-medium mt-1">{track}</p>
                    )}
                    <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      {date !== '—' && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 shrink-0">Date</span>
                          <span className="text-slate-700 font-medium">{date}</span>
                        </div>
                      )}
                      {timeStr !== '—' && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 shrink-0">Time</span>
                          <span className="text-slate-700 font-medium">{timeStr}</span>
                        </div>
                      )}
                      {venue !== '—' && (
                        <div className="flex items-center gap-2 sm:col-span-1">
                          <span className="text-slate-400 shrink-0">Venue</span>
                          <span className="text-slate-700 font-medium">{venue}</span>
                        </div>
                      )}
                    </dl>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
