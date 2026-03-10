/** Event name and code only; price/early bird in header when set. */
export default function EventDetailHeader({ event }) {
  if (!event) return null;

  const currency = event.currency || 'SGD';
  const priceNum = event.price != null && event.price !== '' ? Number(event.price) : null;
  const regularLabel =
    priceNum === null || priceNum === undefined || Number.isNaN(priceNum) || priceNum === 0
      ? 'Free'
      : `${currency} ${Number(priceNum).toLocaleString()}`;

  const earlyBirdNum = event.earlyBirdPrice != null && event.earlyBirdPrice !== '' ? Number(event.earlyBirdPrice) : null;
  const hasEarlyBird = earlyBirdNum !== null && !Number.isNaN(earlyBirdNum) && earlyBirdNum >= 0;
  const earlyBirdLabel = hasEarlyBird
    ? (earlyBirdNum === 0 ? 'Free' : `${currency} ${Number(earlyBirdNum).toLocaleString()}`)
    : null;

  const isEarlyBirdActive = event.isEarlyBirdActive === true;
  // When early bird price is available and lower than regular: show both — original line-through, early bird bold
  const showBothPrices = hasEarlyBird && priceNum != null && priceNum > 0 && earlyBirdNum < priceNum;

  return (
    <header className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            {event.name}
          </h1>
      
        </div>
        {event.eventCode && (
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded shrink-0">
            {event.eventCode}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {showBothPrices ? (
          <span className="flex items-center gap-2">
            <span className="text-sm text-slate-400 line-through font-normal">
              {regularLabel}
            </span>
            <span className="text-sm font-bold text-emerald-600">
              {earlyBirdLabel}
            </span>
          </span>
        ) : (
          <>
            <span className="text-sm font-semibold text-slate-800">
              {regularLabel}
            </span>
            {earlyBirdLabel != null && (
              <span className="text-sm text-slate-600">
                <span className="text-slate-500">Early bird:</span>{' '}
                <span className={isEarlyBirdActive ? 'font-semibold text-primary' : 'font-medium text-slate-700'}>
                  {earlyBirdLabel}
                </span>
                {isEarlyBirdActive && (
                  <span className="ml-1 text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">Active</span>
                )}
              </span>
            )}
          </>
        )}
      </div>
    </header>
  );
}
