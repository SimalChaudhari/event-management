/**
 * EventRegistrationDetails
 *
 * Register Info tab: Event Info + Checkout Info in an attractive card layout.
 * Shows all adminInfo and checkout fields; null/empty values display as "—".
 * @param {{ registrationDetails: any, currency: string, section?: 'all' | 'admin' | 'checkout' }} props
 */
import InfoNotAvailable from "./InfoNotAvailable";

export default function EventRegistrationDetails({ registrationDetails, currency, section = "all" }) {
  if (!registrationDetails) {
    return null;
  }

  const showAdmin = section === "all" || section === "admin";
  const showCheckout = section === "all" || section === "checkout";

  return (
    <div className="p-5 sm:p-6">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-5">
        {section === "admin" ? "Event Info" : section === "checkout" ? "Checkout" : "Register Info"}
      </p>

      <div className="space-y-6">
        {showAdmin && registrationDetails.adminInfo && (
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm border-l-4 border-l-primary">
            <div className="px-4 sm:px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
                  <IconEventInfo className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-semibold text-slate-900">Event Info</h3>
                {registrationDetails.adminInfo.isActive != null && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      registrationDetails.adminInfo.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {registrationDetails.adminInfo.isActive ? "Active" : "Inactive"}
                  </span>
                )}
              </div>
            </div>
            <div className="px-4 sm:px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
                <DetailRow label="Table number" value={registrationDetails.adminInfo.tableNumber} />
                <DetailRow label="Hall" value={registrationDetails.adminInfo.hall} />
                <DetailRow label="Dress code" value={registrationDetails.adminInfo.dressCode} />
                <DetailRow label="Lucky draw number" value={registrationDetails.adminInfo.luckyDrawNumber} />
                <DetailRow label="Lucky draw date & time" value={formatDate(registrationDetails.adminInfo.luckyDrawDateTime)} className="sm:col-span-2" />
                <DetailRow label="Created at" value={formatDate(registrationDetails.adminInfo.createdAt)} />
                <DetailRow label="Updated at" value={formatDate(registrationDetails.adminInfo.updatedAt)} />
                <DetailRow label="Additional information" value={registrationDetails.adminInfo.additionalInformation} className="sm:col-span-2" />
              </div>
            </div>
          </section>
        )}

        {showAdmin && section === "admin" && !registrationDetails.adminInfo && (
          <InfoNotAvailable title="Event info" message="No event info available." variant="tab" />
        )}

        {showCheckout && registrationDetails.checkout && (
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm border-l-4 border-l-emerald-500">
            <div className="px-4 sm:px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <IconCheckout className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-semibold text-slate-900">Checkout Info</h3>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
                <DetailRow label="Order no." value={registrationDetails.checkout.orderNo} />
                <DetailRow
                  label="Order status"
                  value={registrationDetails.checkout.orderStatus ?? registrationDetails.checkout.status}
                  asBadge
                />
                <DetailRow label="Checkout ID" value={registrationDetails.checkout.checkoutId} />
                <DetailRow label="Amount paid" value={registrationDetails.checkout.thisEventAmountPaid != null ? `${currency} ${Number(registrationDetails.checkout.thisEventAmountPaid).toLocaleString()}` : null} />
                <DetailRow label="Discount %" value={registrationDetails.checkout.orderDiscountPercent} />
                <DetailRow label="Coupon code" value={registrationDetails.checkout.couponCode} />
                <DetailRow label="Promo code" value={registrationDetails.checkout.promoCode} />
                <DetailRow label="Payment gateway" value={registrationDetails.checkout.paymentGateway} />
                <DetailRow label="Payment method" value={registrationDetails.checkout.paymentMethod} />
                <DetailRow label="Transaction ID" value={registrationDetails.checkout.transactionId} className="sm:col-span-2" />
                <DetailRow label="Payment notes" value={registrationDetails.checkout.paymentNotes} className="sm:col-span-2" />
                <DetailRow label="Completed" value={registrationDetails.checkout.isCompleted != null ? (registrationDetails.checkout.isCompleted ? "Yes" : "No") : null} />
                <DetailRow label="Created at" value={formatDate(registrationDetails.checkout.createdAt)} />
                <DetailRow label="Completed at" value={formatDate(registrationDetails.checkout.completedAt)} />
                <DetailRow label="Updated at" value={formatDate(registrationDetails.checkout.updatedAt)} />
              </div>
            </div>
          </section>
        )}

        {showCheckout && section === "checkout" && !registrationDetails.checkout && (
          <InfoNotAvailable title="Checkout" message="No checkout or registration details available." variant="tab" />
        )}

        {section === "all" && !registrationDetails.adminInfo && !registrationDetails.checkout && (
          <InfoNotAvailable message="No register info available." variant="tab" />
        )}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (value == null) return null;
  if (typeof value !== "string") return String(value);
  const d = new Date(value.trim());
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Icon: calendar / info (event) */
function IconEventInfo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/** Icon: receipt / order */
function IconCheckout({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function DetailRow({ label, value, asBadge, className = "" }) {
  const display = value != null && String(value).trim() !== "" ? String(value).trim() : "—";

  return (
    <div className={`flex items-center justify-between gap-4 py-2.5 border-b border-slate-100 last:border-b-0 ${className}`}>
      <span className="text-sm text-blue-600 font-medium shrink-0 min-w-[5rem]">{label}:</span>
      <span className="text-sm text-slate-800 text-right break-words min-w-0">
        {asBadge ? (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              /paid|completed|success|confirmed/i.test(display)
                ? "bg-emerald-100 text-emerald-800"
                : /pending|processing/i.test(display)
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {display}
          </span>
        ) : (
          display
        )}
      </span>
    </div>
  );
}
