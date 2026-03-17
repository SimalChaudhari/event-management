import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyRegisteredEvents } from '../../store/actions/eventActions';
import { ROUTES } from '../../routes/routeConfig';
import EngagementQnA from '../../components/engagement/EngagementQnA';
import EngagementPolling from '../../components/engagement/EngagementPolling';
import EngagementSurveys from '../../components/engagement/EngagementSurveys';

const TABS = [
  { id: 'qna', label: 'Q&A' },
  { id: 'polling', label: 'Polling' },
  { id: 'surveys', label: 'Surveys' },
];

/** Use engagements from API (event.engagements has programmeTracks). Fallback from event.programmeTracks. */
function getProgrammeTracks(event) {
  const fromEngagements = event?.engagements?.programmeTracks;
  if (Array.isArray(fromEngagements) && fromEngagements.length > 0) {
    return fromEngagements;
  }
  const tracks = event?.programmeTracks ?? [];
  return tracks.map((track) => ({
    id: track.id,
    title: track.title,
    engagementId: track.engagementId ?? track.engagements?.[0]?.id ?? null,
    sessions: (track.sessions || []).map((s) => ({
      ...s,
      id: s.id,
      title: s.title ?? s.name,
      enableQna: s.enableQna !== false,
      enablePolling: s.enablePolling !== false,
      speakers: s.speakers ?? [],
    })),
  }));
}

export default function Engagement() {
  const dispatch = useDispatch();
  const { myRegisteredEvents, myRegisteredEventsLoading } = useSelector((state) => state.event);
  const { authenticated } = useSelector((state) => state.auth);
  const fetched = useRef(false);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('qna');

  useEffect(() => {
    if (!authenticated) return;
    if (fetched.current) return;
    fetched.current = true;
    dispatch(fetchMyRegisteredEvents());
  }, [dispatch, authenticated]);

  const event = selectedEvent?.event ?? selectedEvent;
  const eventId = event?.id ?? selectedEvent?.eventId ?? null;
  const eventName = event?.name ?? selectedEvent?.eventName ?? 'Event';

  // From event: engagements (Q&A/Polling) and surveyDetails (Surveys) — no extra API
  const programmeTracks = eventId && event ? getProgrammeTracks(event) : [];
  const allSessions = programmeTracks.flatMap((t) => (t.sessions || []).map((s) => ({ ...s, trackTitle: t.title })));
  const surveyDetails = event?.surveyDetails ?? null;
  const pollingLink = allSessions.find((s) => s.polling?.url)?.polling ?? null;

  return (
    <div className="p-4 md:p-6 min-h-[50vh]">
      <p className="text-primary/90 text-sm mb-6">
        Select an event. Use the tabs for <strong>Q&A</strong>, <strong>Polling</strong> and <strong>Surveys</strong> — all from your registered event data.
      </p>

      {!authenticated ? (
        <div className="rounded-lg border border-primary/20 bg-white p-6 text-center">
          <p className="text-slate-600 mb-4">
            Log in to see your events and join Q&A, polling and surveys.
          </p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90"
          >
            Log in
          </Link>
        </div>
      ) : myRegisteredEventsLoading ? (
        <p className="text-slate-500 text-sm py-8 text-center">Loading your events…</p>
      ) : myRegisteredEvents.length === 0 ? (
        <div className="rounded-lg border border-primary/20 bg-white p-6 text-center">
          <p className="text-slate-600 mb-2">You’re not registered for any events yet.</p>
          <p className="text-slate-500 text-sm mb-4">
            Register for an event from the home page to see it here and join engagements.
          </p>
          <Link
            to={ROUTES.HOME}
            className="inline-flex px-4 py-2 text-sm font-medium text-primary bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20"
          >
            Browse events
          </Link>
        </div>
      ) : (
        <>
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-slate-600 mb-2">Your events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myRegisteredEvents.map((ev) => {
                const e = ev.event ?? ev;
                const id = e?.id ?? ev.eventId ?? ev.id;
                const isSelected = selectedEvent?.event?.id === id || selectedEvent?.eventId === id;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      setSelectedEvent(ev);
                      setActiveTab('qna');
                    }}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium text-slate-800 line-clamp-2">{e?.name ?? 'Event'}</p>
                    {e?.startDate && (
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(e.startDate).toLocaleDateString()}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {selectedEvent && (
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                <h2 className="text-lg font-semibold text-slate-800">{eventName}</h2>
                <div className="flex gap-1 mt-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 md:p-6">
                {activeTab === 'qna' ? (
                  <div className="space-y-8">
                    {programmeTracks.length === 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-slate-500 text-sm">No Q&A data for this event.</p>
                      </div>
                    ) : (
                      programmeTracks.map((track) => (
                        <div key={track.id ?? track.engagementId}>
                          <h3 className="text-base font-semibold text-slate-700 mb-4">
                            {track.title ?? 'Track'}
                          </h3>
                          <div className="space-y-6">
                            {(track.sessions || []).map((session) => (
                              <EngagementQnA
                                key={session.id}
                                engagementId={track.engagementId}
                                sessionId={session.id}
                                sessionTitle={session.title}
                                disabled={!track.engagementId || session.enableQna === false}
                                initialQuestions={session.questions ?? []}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : activeTab === 'polling' ? (
                  <EngagementPolling
                    eventId={eventId}
                    sessions={allSessions}
                    pollingLink={pollingLink}
                    initialPollByKey={event?.engagements?.pollByKey}
                  />
                ) : (
                  <EngagementSurveys eventId={eventId} surveyDetails={surveyDetails} />
                )}
              </div>
            </section>
          )}

          {!selectedEvent && (
            <p className="text-slate-500 text-sm text-center py-6">Select an event above.</p>
          )}
        </>
      )}
    </div>
  );
}
