/** Event name and price in header; early bird only when it's a non-free discount. */
export default function EventDetailHeader({ event }) {
  if (!event) return null;

  const currency = event.currency || 'SGD';
  const priceNum = event.price != null && event.price !== '' ? Number(event.price) : null;
  const regularLabel =
    priceNum === null || priceNum === undefined || Number.isNaN(priceNum) || priceNum === 0
      ? 'Free'
      : `${currency} ${Number(priceNum).toLocaleString()}`;

  const earlyBirdNum = event.earlyBirdPrice != null && event.earlyBirdPrice !== '' ? Number(event.earlyBirdPrice) : null;
  const hasEarlyBird = earlyBirdNum !== null && !Number.isNaN(earlyBirdNum) && earlyBirdNum > 0;
  const earlyBirdLabel = hasEarlyBird
    ? `${currency} ${Number(earlyBirdNum).toLocaleString()}`
    : null;

  const isEarlyBirdActive = event.isEarlyBirdActive === true;
  const showBothPrices = hasEarlyBird && priceNum != null && priceNum > 0 && earlyBirdNum < priceNum;

  return (
    <header className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            {event.name}
          </h1>
        </div>
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
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-sm ${
                regularLabel === 'Free'
                  ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-200'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
              {regularLabel === 'Free' && (
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )}
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
