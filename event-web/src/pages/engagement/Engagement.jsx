import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import EventCard from '../../components/EventCard';
import { fetchMyRegisteredEvents } from '../../store/actions/eventActions';
import { ROUTES } from '../../routes/routeConfig';

export default function Engagement() {
  const dispatch = useDispatch();
  const { myRegisteredEvents, myRegisteredEventsLoading } = useSelector((state) => state.event);
  const { authenticated } = useSelector((state) => state.auth);
  const fetched = useRef(false);

  useEffect(() => {
    if (!authenticated) return;
    if (fetched.current) return;
    fetched.current = true;
    dispatch(fetchMyRegisteredEvents({ limit: 20 }));
  }, [dispatch, authenticated]);

  return (
    <div className="p-4 md:p-6 min-h-[50vh]">
      <p className="text-primary/90 text-sm mb-6">
        Participate in <strong>Q&A</strong>, <strong>polling</strong> and <strong>surveys</strong> for events you’re registered for. Open an event below to view engagements and ask questions.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myRegisteredEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} registrationId={ev.id} />
          ))}
        </div>
      )}
    </div>
  );
}
