import { Link } from 'react-router-dom';
import { UPLOADS_URL } from '../config';
import { getEventDetailPath } from '../routes/routeConfig';

export default function EventCard({ event, compact }) {
  const imageUrl = event.image
    ? (event.image.startsWith('http') ? event.image : `${UPLOADS_URL}/${event.image}`)
    : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=240&fit=crop';

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
  };

  const displayPrice = event.earlyBirdPrice != null ? event.earlyBirdPrice : event.price;
  const hasDiscount = event.earlyBirdPrice != null && event.price != null && event.earlyBirdPrice < event.price;
  const currency = event.currency || 'SGD';

  if (compact) {
    return (
      <Link
        to={getEventDetailPath(event.id)}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 active:scale-[0.98] active:shadow transition-all"
      >
        <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
          <img src={imageUrl} alt={event.name} className="w-full h-full object-cover" />
          <button
            type="button"
            className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-slate-800 shadow-md"
            aria-label="Add to favourites"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
        <p className="text-base font-semibold text-slate-800 px-3 py-3">{event.name}</p>
      </Link>
    );
  }

  return (
    <Link
      to={getEventDetailPath(event.id)}
      className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 active:scale-[0.98] active:shadow transition-all"
    >
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <img src={imageUrl} alt={event.name} className="w-full h-full object-cover" />
        <div className="absolute top-2.5 right-2.5 flex gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-slate-800 shadow-md"
            aria-label="Favourite"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-slate-800 shadow-md"
            aria-label="Add to cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </button>
        </div>
      </div>
      <div className="px-3 pb-3">
        <h3 className="text-base font-semibold text-slate-800 pt-3 mb-1">{event.name}</h3>
        {event.description && (
          <p className="text-[13px] text-slate-500 mb-1.5 leading-snug">
            {event.description.slice(0, 50)}{event.description.length > 50 ? '…' : ''}
          </p>
        )}
        <p className="text-[13px] text-slate-500 mb-1.5">Event: {formatDate(event.startDate)}</p>
        <div className="flex items-center gap-2 mb-1">
          {hasDiscount && (
            <span className="text-[13px] text-slate-500 line-through">
              {currency} {Number(event.price).toLocaleString()}
            </span>
          )}
          <span className="text-base font-bold text-primary">
            {currency} {displayPrice != null ? Number(displayPrice).toLocaleString() : 'Free'}
          </span>
        </div>
        {event.attendanceCount != null && event.attendanceCount > 0 && (
          <p className="text-xs text-slate-500">Attendance: {Number(event.attendanceCount).toLocaleString()}</p>
        )}
      </div>
    </Link>
  );
}
