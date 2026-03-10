import { sanitizeHtml } from "../utils/sanitizeHtml";
import pdfIcon from "../assets/pdf/pdf.png";

function fullUrl(path, uploadsUrl) {
  if (!path || String(path).trim() === "") return null;
  return path.startsWith("http") ? path : `${uploadsUrl}/${path}`;
}

/* Event detail style label/value row */
function DetailRow({ label, value, href }) {
  const hasValue = value != null && String(value).trim() !== "";
  if (!hasValue) return null;
  const text = String(value).trim();
  const isHttp = href && href.startsWith("http");
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-200 last:border-b-0">
      <span className="text-sm text-blue-600 font-medium shrink-0 min-w-[7rem]">
        {label}:
      </span>
      <span className="text-sm text-slate-800 text-right break-words min-w-0">
        {href ? (
          <a
            href={href}
            target={isHttp ? "_blank" : undefined}
            rel={isHttp ? "noopener noreferrer" : undefined}
            className="text-primary hover:underline"
          >
            {text}
          </a>
        ) : (
          text
        )}
      </span>
    </div>
  );
}

const IconImagePlaceholder = () => (
  <svg
    className="w-12 h-12 text-slate-300"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

/* Star rating display: 5 stars, hide when no reviews */
function StarRating({ averageRating = 0, totalRatings = 0, className = "" }) {
  if (!totalRatings || totalRatings <= 0) return null;
  const value = Math.min(5, Math.max(0, Number(averageRating)));
  const full = Math.round(value);
  const empty = 5 - full;
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center shrink-0" aria-hidden>
        {Array.from({ length: full }).map((_, i) => (
          <StarIcon key={`f-${i}`} filled className="w-4 h-4 text-amber-500" />
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <StarIcon key={`e-${i}`} filled={false} className="w-4 h-4 text-slate-300" />
        ))}
      </div>
      <span className="text-sm text-slate-700 whitespace-nowrap">
        {Number(averageRating).toFixed(1)} ({totalRatings} review
        {totalRatings !== 1 ? "s" : ""})
      </span>
    </div>
  );
}

function StarIcon({ filled, className }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

const IconWebsite = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconEmail = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconPhone = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

function SocialIcon({ platform, className = "w-4 h-4" }) {
  const name = (platform || "").toLowerCase();

  if (name.includes("facebook")) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (name.includes("instagram")) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (name.includes("linkedin")) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (name === "x" || name.includes("twitter")) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default function EventExhibitors({ exhibitorsData = {}, uploadsUrl = "", onImageClick }) {
  const description = exhibitorsData?.exhibitorDescription;
  const exhibitors = exhibitorsData?.exhibitors ?? [];

  if (exhibitors.length === 0 && !description) {
    return (
      <div className="p-5 sm:p-6">
        <p className="text-slate-500 text-sm">No exhibitors listed.</p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6">
      {description && (
        <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            About exhibitors
          </p>
          <div
            className="text-sm text-slate-700 prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
          />
        </div>
      )}

      {exhibitors.length > 0 && (
        <ul className="space-y-6">
          {exhibitors.map((ex) => {
            const logoUrl = fullUrl(ex.logo, uploadsUrl);
            const companyName = ex.companyName || "Exhibitor";
            const socialWithLinks = (ex.socialMedia ?? []).filter(
              (s) => s?.link != null && String(s.link).trim() !== ""
            );
            const staffRaw = ex.eventStaff ?? ex.event_staff ?? [];
            const staff = Array.isArray(staffRaw) ? staffRaw : [];
            const ratingRaw = ex.rating;
            const rating =
              ratingRaw != null
                ? {
                    averageRating: ratingRaw.averageRating ?? ratingRaw.average_rating ?? 0,
                    totalRatings: ratingRaw.totalRatings ?? ratingRaw.total_ratings ?? 0,
                  }
                : null;
            const hasRating = rating != null && rating.totalRatings > 0;
            const hasContact =
              (ex.uen && String(ex.uen).trim() !== "") ||
              (ex.boothNumber && String(ex.boothNumber).trim() !== "") ||
              (ex.boothCode && String(ex.boothCode).trim() !== "") ||
              hasRating;
            const flyers = ex.flyers ?? [];
            const documents = ex.documents ?? [];
            const eventImages = ex.eventImages ?? [];
            const boothBanner = ex.boothBanner ?? [];
            const hasDescription =
              ex.companyDescription != null && String(ex.companyDescription).trim() !== "";
            const hasPromo =
              ex.promotionalOfferNote != null && String(ex.promotionalOfferNote).trim() !== "";

            return (
              <li
                key={ex.id}
                className="rounded-xl border border-slate-200 bg-slate-50/30 overflow-hidden"
              >
                {/* Header: logo + name + primary contact */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:px-5 pt-4 pb-4 border-b border-slate-200">
                  <div className="shrink-0">
                    {logoUrl ? (
                      onImageClick ? (
                        <button
                          type="button"
                          onClick={() => onImageClick(logoUrl, companyName)}
                          className="block w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-200 bg-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <img
                            src={logoUrl}
                            alt={companyName}
                            className="w-full h-full object-contain p-2"
                          />
                        </button>
                      ) : (
                        <img
                          src={logoUrl}
                          alt={companyName}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200 bg-white object-contain p-2"
                        />
                      )
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-1 p-2">
                        <IconImagePlaceholder />
                        <span className="text-xs text-slate-400">No logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-slate-900">{companyName}</h3>
                    {ex.website?.trim() && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-slate-500 shrink-0" aria-hidden>
                          <IconWebsite />
                        </span>
                        <a
                          href={
                            ex.website.startsWith("http") ? ex.website : `https://${ex.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {ex.website.replace(/^https?:\/\//i, "")}
                        </a>
                      </div>
                    )}
                    {(ex.email?.trim() || ex.mobile?.trim()) && (
                      <div className="mt-2 space-y-1 text-sm text-slate-600">
                        {ex.email?.trim() && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 shrink-0" aria-hidden>
                              <IconEmail />
                            </span>
                            <a
                              href={`mailto:${ex.email}`}
                              className="text-primary hover:underline"
                            >
                              {ex.email}
                            </a>
                          </div>
                        )}
                        {ex.mobile?.trim() && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 shrink-0" aria-hidden>
                              <IconPhone />
                            </span>
                            <a href={`tel:${ex.mobile}`} className="text-primary hover:underline">
                              {ex.mobile}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {socialWithLinks.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {socialWithLinks.map((s) => {
                          const name = (s.platform || "").toLowerCase();
                          let iconColor = "text-slate-500 hover:text-slate-700";
                          if (name.includes("facebook"))
                            iconColor = "text-[#1877F2] hover:opacity-80";
                          else if (name.includes("instagram"))
                            iconColor = "text-[#E4405F] hover:opacity-80";
                          else if (name.includes("linkedin"))
                            iconColor = "text-[#0A66C2] hover:opacity-80";
                          else if (name === "x" || name.includes("twitter"))
                            iconColor = "text-slate-700 hover:opacity-80";
                          return (
                            <a
                              key={s.platform}
                              href={s.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`shrink-0 p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors ${iconColor}`}
                              title={s.platform}
                            >
                              <span className="[&>svg]:w-4 [&>svg]:h-4 block">
                                <SocialIcon platform={s.platform} />
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact & details – 2-column grid, only when there is contact info */}
                {hasContact && (
                  <div className="px-4 sm:px-5 pt-4 pb-4 border-t border-slate-200">
                 
                    <div className="gap-x-8 gap-y-0">
                      <div className="space-y-0">
                        <DetailRow label="UEN" value={ex.uen} />
                        <DetailRow
                          label="Booth code"
                          value={ex.boothNumber ?? ex.boothCode}
                        />
                      </div>
                      <div className="space-y-0">
                        {hasRating && (
                          <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-200 last:border-b-0">
                            <span className="text-sm text-blue-600 font-medium shrink-0">
                              Rating:
                            </span>
                            <StarRating
                              averageRating={rating.averageRating}
                              totalRatings={rating.totalRatings}
                              className="justify-end"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {hasDescription && (
                  <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                      Description
                    </p>
                    <div
                      className="text-sm text-slate-700 prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(ex.companyDescription),
                      }}
                    />
                  </div>
                )}

                {/* Promotional offer */}
                {hasPromo && (
                  <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                      Promotional offer
                    </p>
                    <div
                      className="text-sm text-slate-700 prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(ex.promotionalOfferNote),
                      }}
                    />
                  </div>
                )}

                {/* Documents */}
                {documents.length > 0 && (
                  <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                      Documents
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {documents.map((d) => {
                        const url = fullUrl(d.document, uploadsUrl);
                        const name = d.name || "Document";
                        return (
                          <a
                            key={d.id}
                            href={url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex flex-col items-center rounded-xl border border-slate-200 bg-white p-3 min-w-[100px] max-w-[140px] hover:border-primary/40 hover:shadow-md hover:bg-slate-50/50 transition-all duration-200"
                          >
                            <span className="w-12 h-14 flex items-center justify-center shrink-0">
                              <img
                                src={pdfIcon}
                                alt="PDF"
                                className="w-full h-full object-contain"
                              />
                            </span>
                            <span className="text-xs font-medium text-slate-800 mt-2 text-center line-clamp-2">
                              {name}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Flyers */}
                {flyers.length > 0 && (
                  <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                      Flyers
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {flyers.map((f) => {
                        const url = fullUrl(f.flyer, uploadsUrl);
                        const name = f.name || "Flyer";
                        if (!url) return null;
                        return (
                          <div
                            key={f.id}
                            className="group rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
                          >
                            {onImageClick ? (
                              <button
                                type="button"
                                onClick={() => onImageClick(url, name)}
                                className="block w-full aspect-[3/4] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                              >
                                <img
                                  src={url}
                                  alt={name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </button>
                            ) : (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full aspect-[3/4]"
                              >
                                <img
                                  src={url}
                                  alt={name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </a>
                            )}
                            <p className="text-xs font-medium text-slate-700 px-2 py-1.5 truncate border-t border-slate-100">
                              {name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Event images */}
                {eventImages.length > 0 && (
                  <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                      Event images
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                      {eventImages.map((img) => {
                        const url = fullUrl(img.eventImage, uploadsUrl);
                        const name = img.name || "Image";
                        if (!url) return null;
                        return (
                          <div
                            key={img.id}
                            className="group rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-200"
                          >
                            {onImageClick ? (
                              <button
                                type="button"
                                onClick={() => onImageClick(url, name)}
                                className="block w-full aspect-square focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                              >
                                <img
                                  src={url}
                                  alt={name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </button>
                            ) : (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full aspect-square"
                              >
                                <img
                                  src={url}
                                  alt={name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </a>
                            )}
                            <p className="text-xs font-medium text-slate-600 px-2 py-1 truncate border-t border-slate-100 bg-slate-50/50">
                              {name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Booth banner */}
                {boothBanner.length > 0 && (
                  <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                      Booth banner
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                      {boothBanner.map((b) => {
                        const url = fullUrl(b.value, uploadsUrl);
                        if (!url) return null;
                        return (
                          <div
                            key={b.id}
                            className="group rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-200"
                          >
                            {onImageClick ? (
                              <button
                                type="button"
                                onClick={() => onImageClick(url, "Booth banner")}
                                className="block w-full aspect-video focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                              >
                                <img
                                  src={url}
                                  alt="Booth banner"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </button>
                            ) : (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full aspect-video"
                              >
                                <img
                                  src={url}
                                  alt="Booth banner"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Event staff */}
                {staff.length > 0 && (
                  <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                      Event staff
                    </p>
                    <ul className="space-y-0">
                      {staff.map((s, idx) => {
                        const id = s.id ?? s.userId ?? `staff-${idx}`;
                        const firstName = s.firstName ?? s.first_name ?? "";
                        const lastName = s.lastName ?? s.last_name ?? "";
                        const name = [firstName, lastName].filter(Boolean).join(" ") || "—";
                        const email = s.email ?? "";
                        const mobile = s.mobile ?? "";
                        const role = s.role ?? "";
                        return (
                          <li
                            key={id}
                            className="py-3 border-b border-slate-200 last:border-b-0"
                          >
                            <p className="text-sm font-semibold text-slate-800">{name}</p>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0 text-sm text-slate-600">
                              {email && (
                                <a
                                  href={`mailto:${email}`}
                                  className="text-primary hover:underline"
                                >
                                  {email}
                                </a>
                              )}
                              {mobile && (
                                <a
                                  href={`tel:${mobile}`}
                                  className="text-primary hover:underline"
                                >
                                  {mobile}
                                </a>
                              )}
                              {role && (
                                <span className="text-slate-500 capitalize">{role}</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {exhibitors.length === 0 && description && (
        <p className="text-slate-500 text-sm">No exhibitors listed.</p>
      )}
    </div>
  );
}

