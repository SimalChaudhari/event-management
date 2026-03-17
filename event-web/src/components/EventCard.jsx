import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UPLOADS_URL } from '../config';
import { getEventDetailPath } from '../routes/routeConfig';
import { ROUTES } from '../routes/routeConfig';

/** True if event has ended (end date+time or start date+time is in the past) */
export function isPastEvent(event) {
  if (!event) return false;
  const dateStr = event.endDate || event.startDate;
  const timeStr = event.endTime || event.startTime;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (timeStr) {
    const [h, m, s] = timeStr.split(':').map(Number);
    d.setHours(h ?? 0, m ?? 0, s ?? 0);
  }
  return d.getTime() < Date.now();
}

export default function EventCard({ event, compact, clickable = true, registrationId }) {
  const { authenticated } = useSelector((s) => s.auth);
  const e = event?.event ?? event;
  const imgPath = e?.images?.[0] ?? e?.image;
  const imageUrl = imgPath
    ? (String(imgPath).startsWith('http') ? imgPath : `${UPLOADS_URL}/${String(imgPath).replace(/^\//, '')}`)
    : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=240&fit=crop';

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
  };

  const currency = e.currency || 'SGD';
  const priceRaw = e.price != null && e.price !== '' ? Number(e.price) : null;
  const earlyBirdRaw = e.earlyBirdPrice != null && e.earlyBirdPrice !== '' ? Number(e.earlyBirdPrice) : null;
  const hasValidPrice = priceRaw !== null && !Number.isNaN(priceRaw) && priceRaw > 0;
  const hasRealEarlyBird = earlyBirdRaw !== null && !Number.isNaN(earlyBirdRaw) && earlyBirdRaw > 0;
  const hasDiscount = hasRealEarlyBird && hasValidPrice && earlyBirdRaw < priceRaw;
  const displayPriceNum = hasDiscount ? earlyBirdRaw : priceRaw;
  const priceLabel =
    displayPriceNum === null || displayPriceNum === undefined || Number.isNaN(displayPriceNum) || displayPriceNum === 0
      ? 'Free'
      : `${currency} ${Number(displayPriceNum).toLocaleString()}`;
  const regularPriceLabel = hasDiscount && hasValidPrice ? `${currency} ${Number(priceRaw).toLocaleString()}` : null;

  if (compact) {
    return clickable ? (
      <Link
        to={registrationId ? getEventDetailPath(registrationId, { byRegistration: true }) : getEventDetailPath(e.id)}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 active:scale-[0.98] active:shadow transition-all"
      >
        <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
          <img src={imageUrl} alt={e.name} className="w-full h-full object-cover" />
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
        <p className="text-base font-semibold text-slate-800 px-3 py-3">{e.name}</p>
      </Link>
    ) : (
      <div className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
        <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
          <img src={imageUrl} alt={e.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Link
              to={ROUTES.LOGIN}
              className="text-white text-sm font-medium bg-primary px-3 py-1.5 rounded-full hover:opacity-90"
            >
              Log in to view
            </Link>
          </div>
        </div>
        <p className="text-base font-semibold text-slate-800 px-3 py-3">{e.name}</p>
      </div>
    );
  }

  return clickable ? (
    <Link
      to={registrationId ? getEventDetailPath(registrationId, { byRegistration: true }) : getEventDetailPath(e.id)}
      className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 active:scale-[0.98] active:shadow transition-all"
    >
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <img src={imageUrl} alt={e.name} className="w-full h-full object-cover" />
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
        <h3 className="text-base font-semibold text-slate-800 pt-3 mb-1">{e.name}</h3>
        <p className="text-[13px] text-slate-500 mb-1.5">Event: {formatDate(e.startDate)}</p>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {hasDiscount && regularPriceLabel && (
            <span className="text-[13px] text-slate-500 line-through">
              {regularPriceLabel}
            </span>
          )}
          <span className="text-base font-bold text-primary">
            {priceLabel}
          </span>
        </div>
        {authenticated && e.attendanceCount != null && e.attendanceCount > 0 && (
          <p className="text-xs text-slate-500">Attendance: {Number(e.attendanceCount).toLocaleString()}</p>
        )}
      </div>
    </Link>
  ) : (
    <div className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <img src={imageUrl} alt={e.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Link
            to={ROUTES.LOGIN}
            className="text-white text-sm font-medium bg-primary px-3 py-1.5 rounded-full hover:opacity-90"
          >
            Log in to view
          </Link>
        </div>
      </div>
      <div className="px-3 pb-3">
        <h3 className="text-base font-semibold text-slate-800 pt-3 mb-1">{e.name}</h3>
        <p className="text-[13px] text-slate-500 mb-1.5">Event: {formatDate(e.startDate)}</p>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {hasDiscount && regularPriceLabel && (
            <span className="text-[13px] text-slate-500 line-through">
              {regularPriceLabel}
            </span>
          )}
          <span className="text-base font-bold text-primary">
            {priceLabel}
          </span>
        </div>
        {authenticated && e.attendanceCount != null && e.attendanceCount > 0 && (
          <p className="text-xs text-slate-500">Attendance: {Number(e.attendanceCount).toLocaleString()}</p>
        )}
      </div>
      <div className="px-3 pb-3 pt-0">
        <Link to={ROUTES.LOGIN} className="text-sm font-medium text-primary hover:underline">
          Log in to view event details
        </Link>
      </div>
    </div>
  );
}
