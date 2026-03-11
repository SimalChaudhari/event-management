/**
 * InfoNotAvailable — Reusable empty state when information is not found or not available.
 * Use for: no documents, no floor plan, no stamps, no speakers, no description, etc.
 *
 * @param {{ title?: string, message: string, variant?: 'section' | 'tab' }} props
 * - title: Optional section label (e.g. "Documents", "Floor plan")
 * - message: Main message (e.g. "No documents available.")
 * - variant: 'section' = compact block inside a card; 'tab' = larger padding for full tab
 */
export default function InfoNotAvailable({ title, message, variant = "section" }) {
  const isTab = variant === "tab";

  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center text-center ${
        isTab ? "px-6 py-8" : "px-4 py-6"
      }`}
      role="status"
      aria-label={message}
    >
      <span
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/5 text-primary/60 mb-2 ring-1 ring-primary/10"
        aria-hidden
      >
        <InboxIcon className="w-5 h-5" />
      </span>
      {title && (
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {title}
        </p>
      )}
      <p className="text-sm text-slate-600 font-medium leading-snug max-w-[16rem]">
        {message}
      </p>
    </div>
  );
}

/** Inbox / empty content icon — friendly empty state */
function InboxIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  );
}
