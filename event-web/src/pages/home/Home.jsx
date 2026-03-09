import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Banner from '../../components/Banner';
import EventCard from '../../components/EventCard';
import { fetchMobileEventList, fetchMyRegisteredEvents } from '../../store/actions/eventActions';
import { ROUTES } from '../../routes/routeConfig';

export default function Home() {
  const dispatch = useDispatch();
  const { list, upcoming, myRegisteredEvents, loading, myRegisteredEventsLoading } = useSelector((state) => state.event);
  const { authenticated } = useSelector((state) => state.auth);
  const [upcomingTab, setUpcomingTab] = useState('ALL EVENTS');
  const eventsFetched = useRef(false);
  const registeredFetched = useRef(false);

  useEffect(() => {
    if (eventsFetched.current) return;
    eventsFetched.current = true;
    dispatch(fetchMobileEventList({ limit: 8 }));
    dispatch(fetchMobileEventList({ upcoming: true, limit: 6 }));
  }, [dispatch]);

  useEffect(() => {
    if (!authenticated) {
      registeredFetched.current = false;
      return;
    }
    if (registeredFetched.current) return;
    registeredFetched.current = true;
    dispatch(fetchMyRegisteredEvents({ limit: 4 }));
  }, [dispatch, authenticated]);

  const featured = list.slice(0, 4);

  return (
    <>
      <Banner />

      {authenticated && (
        <>
          <section className="flex justify-between items-center mb-3 pt-5">
            <h2 className="text-lg font-bold text-slate-800">My Registered Event</h2>
            <Link to={ROUTES.MY_EVENTS} className="text-sm font-medium text-primary">See more</Link>
          </section>
          {myRegisteredEventsLoading ? (
            <p className="py-10 px-5 text-center text-slate-500">Loading…</p>
          ) : myRegisteredEvents.length === 0 ? (
            <p className="py-10 px-5 text-center text-slate-500">No registered events. Register for an event to see it here.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {myRegisteredEvents.slice(0, 4).map((ev) => (
                <EventCard key={ev.id} event={ev} compact />
              ))}
            </div>
          )}
        </>
      )}

      <section className="flex justify-between items-center mb-3 pt-5">
        <h2 className="text-lg font-bold text-slate-800">Featured Event</h2>
        <Link to={ROUTES.EVENTS_FEATURED} className="text-sm font-medium text-primary">See more</Link>
      </section>
      {loading ? null : featured.length === 0 ? (
        <p className="py-10 px-5 text-center text-slate-500">No featured events.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {featured.slice(0, 4).map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      )}

      <section className="flex justify-between items-center mb-3 pt-5">
        <h2 className="text-lg font-bold text-slate-800">Upcoming Event</h2>
        <Link to={ROUTES.EVENTS_UPCOMING} className="text-sm font-medium text-primary">See more</Link>
      </section>
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {['ALL EVENTS', 'CONFERENCE', 'WORKSHOP', 'WEBINAR'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`flex-shrink-0 px-3.5 py-2 text-xs font-semibold tracking-wider rounded-full whitespace-nowrap transition-colors ${
              upcomingTab === tab
                ? 'text-white bg-primary border border-primary'
                : 'text-slate-500 bg-white border border-slate-200'
            }`}
            onClick={() => setUpcomingTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {loading ? null : upcoming.length === 0 ? (
        <p className="py-10 px-5 text-center text-slate-500">No upcoming events.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {upcoming.slice(0, 4).map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </>
  );
}
