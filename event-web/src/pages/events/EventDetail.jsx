import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROUTES } from "../../routes/routeConfig";
import { getEventById } from "../../services/eventService";
import { getRegisterEventById } from "../../services/registerEventService";
import { UPLOADS_URL } from "../../config";
import SpeakerCard from "../../components/SpeakerCard";
import EventDetailHeader from "../../components/EventDetailHeader";
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import pdfIcon from "../../assets/pdf/pdf.png";
import EventGallery from "../../components/EventGallery";
import ImageLightbox from "../../components/ImageLightbox";
import EventSurveyDetails from "../../components/EventSurveyDetails";
import EventExhibitors from "../../components/EventExhibitors";
import EventRegistrationDetails from "../../components/EventRegistrationDetails";
import InfoNotAvailable from "../../components/InfoNotAvailable";

/**
 * EventDetail — Single event view with tabbed sections.
 * Fetches event by ID (or by registration ID when ?by=registration).
 * Tabs: Details (overview, about, documents, floor plan, stamps), Speakers, Gallery, Survey, Exhibitors, Register Info.
 * Scrolls to top and resets tab when event ID changes.
 */
export default function EventDetail() {
  // ——— Router & auth ———
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const byRegistration = searchParams.get("by") === "registration";
  const { authenticated } = useSelector((s) => s.auth);

  // ——— State ———
  const [event, setEvent] = useState(null);
  const [registrationDetails, setRegistrationDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [lightbox, setLightbox] = useState({ src: null, alt: "" });

  // ——— Effects: fetch event (by id or registration), reset tab + scroll on id change ———
  useEffect(() => {
    if (!id || !authenticated) {
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError("");
    const fetchData = () => {
      if (byRegistration) {
        return getRegisterEventById(id, { signal: ac.signal }).then((data) => {
          if (data && (data.event || data.id)) {
            setEvent(data.event ?? data);
            setRegistrationDetails({
              id: data.id,
              type: data.type,
              status: data.status,
              user: data.user,
              adminInfo: data.adminInfo,
              checkout: data.checkout,
              billingDetails: data.billingDetails,
            });
            setError("");
          } else {
            setError(data?.message || "Event not found.");
          }
        });
      }
      return getEventById(id, { signal: ac.signal }).then((data) => {
        if (data && (data.id || data.name)) {
          setEvent(data);
          setRegistrationDetails(null);
          setError("");
        } else {
          setError(data?.message || "Event not found.");
        }
      });
    };
    fetchData()
      .catch((err) => {
        if (err.name === "AbortError") return;
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message;
        setError(msg || "Failed to load event.");
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [id, authenticated, byRegistration]);

  // On event id change: reset to Details tab and scroll page to top
  useEffect(() => {
    setActiveTab("details");
    window.scrollTo(0, 0);
  }, [id]);

  // ——— Format helpers ———
  const formatDate = (d, time) => {
    if (!d) return "—";
    const date = new Date(d);
    let str = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      weekday: "short",
    });
    if (time) str += ` · ${time}`;
    return str;
  };

  const formatPublishDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // ——— Derived data: event slices, registration flag, tab config, hero image ———
  const currency = event?.currency || "SGD";

  const galleries = event?.galleries ?? [];
  const hasRegistration =
    registrationDetails &&
    (registrationDetails.adminInfo ||
      registrationDetails.checkout ||
      registrationDetails.user);
  const speakers = event?.speakersData ?? event?.speakers ?? [];
  const documents = event?.documents ?? [];
  const eventStamps = event?.eventStamps?.stamps ?? [];
  const exhibitorsData = event?.exhibitorsData ?? {};
  const exhibitors = exhibitorsData?.exhibitors ?? [];

  const hasSpeakers = speakers.length > 0;
  const hasGallery = galleries.length > 0;
  const hasSurvey = event?.surveyDetails != null;
  const hasExhibitors = exhibitors.length > 0;

  const tabs = [
    { id: "details", label: "Details" },
    ...(hasSpeakers ? [{ id: "speakers", label: "Speakers" }] : []),
    ...(hasGallery ? [{ id: "gallery", label: "Gallery" }] : []),
    ...(hasSurvey ? [{ id: "survey", label: "Survey" }] : []),
    ...(hasExhibitors ? [{ id: "exhibitors", label: "Exhibitors" }] : []),
    ...(hasRegistration
      ? [{ id: "register-info", label: "Register Info" }]
      : []),
  ];

  const visibleTabIds = tabs.map((t) => t.id);
  const activeTabValid = visibleTabIds.includes(activeTab);
  const currentTab = activeTabValid ? activeTab : (tabs[0]?.id ?? "details");

  // Hero image: event image, background, first gallery image, or placeholder
  const imageUrl = event?.images?.[0]
    ? event.images[0].startsWith("http")
      ? event.images[0]
      : `${UPLOADS_URL}/${event.images[0]}`
    : event?.backgroundImage
      ? event.backgroundImage.startsWith("http")
        ? event.backgroundImage
        : `${UPLOADS_URL}/${event.backgroundImage}`
      : galleries.length > 0 && galleries[0].galleryImages?.[0]
        ? String(galleries[0].galleryImages[0]).startsWith("http")
          ? galleries[0].galleryImages[0]
          : `${UPLOADS_URL}/${galleries[0].galleryImages[0]}`
        : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop";

  // ——— Render ———
  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Auth gate: require login to view event */}
      {!authenticated && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-amber-800 mb-4">Log in to view this event.</p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:opacity-90"
          >
            Log in
          </Link>
        </div>
      )}

      {authenticated && (
        <>
          {/* Loading state */}
          {loading && (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-500">
              Loading event…
            </div>
          )}

          {/* Error state (after load) */}
          {error && !loading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Main content: header, tab bar, tab panels */}
          {event && !loading && (
            <>
              <EventDetailHeader event={event} />

              {/* Tab bar — only tabs with data are shown */}
              <div className="border-b border-slate-200 mb-5">
                <nav
                  className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px"
                  aria-label="Event details tabs"
                >
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        currentTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab panels — one visible at a time via currentTab */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tab: Details — overview, about, documents, floor plan, event stamps */}
                {currentTab === "details" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/30 overflow-hidden">
                    {/* Hero: cover image + date badges */}
                    <div className="relative w-full rounded-t-xl overflow-hidden border-b border-slate-200 aspect-[2/1] sm:aspect-[3/1] max-h-48 sm:max-h-56 bg-slate-200">
                      <button
                        type="button"
                        onClick={() => setLightbox({ src: imageUrl, alt: event.name })}
                        className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                      >
                        <img
                          src={imageUrl}
                          alt={event.name}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        />
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
                        {event.startDate && (
                          <span className="px-2.5 py-1 rounded-md bg-white/95 text-slate-800 text-xs font-medium shadow-sm">
                            {formatDate(event.startDate, event.startTime)}
                          </span>
                        )}
                        {event.endDate && (
                          <span className="px-2.5 py-1 rounded-md bg-white/95 text-slate-800 text-xs font-medium shadow-sm">
                            → {formatDate(event.endDate, event.endTime)}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Details grid: type, location, country, venue, dates, map link */}
                    <div className="px-4 sm:px-5 pt-4 pb-4 border-t border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
                        {/* Left column */}
                        <div className="space-y-0">
                          <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-200">
                            <span className="text-sm text-blue-600 font-medium shrink-0">
                              Event Type:
                            </span>
                            <span className="text-sm text-slate-800 text-right">
                              <span
                                className={`inline-flex items-center rounded-full text-white text-xs font-medium px-2.5 py-1 ${(event.type || "Physical") === "Virtual" ? "bg-indigo-500" : "bg-slate-600"}`}
                              >
                                {event.type || "Physical"}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-200">
                            <span className="text-sm text-blue-600 font-medium shrink-0">
                              Location:
                            </span>
                            <span className="text-sm text-slate-800 text-right">
                              {event.location || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-200">
                            <span className="text-sm text-blue-600 font-medium shrink-0">
                              Country:
                            </span>
                            <span className="text-sm text-slate-800 text-right">
                              {event.country || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-200">
                            <span className="text-sm text-blue-600 font-medium shrink-0">
                              Publish Start Date:
                            </span>
                            <span className="text-sm text-slate-800 text-right">
                              {formatPublishDate(event.startDate)}
                            </span>
                          </div>
                        </div>
                        {/* Right column */}
                        <div className="space-y-0">
                          {authenticated && (
                            <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-200">
                              <span className="text-sm text-blue-600 font-medium shrink-0">
                                Attendance Count:
                              </span>
                              <span className="text-sm text-slate-800 text-right">
                                {event.attendanceCount != null
                                  ? Number(event.attendanceCount).toLocaleString()
                                  : "—"}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-200">
                            <span className="text-sm text-blue-600 font-medium shrink-0">
                              Venue:
                            </span>
                            <span className="text-sm text-slate-800 text-right">
                              {event.venue || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-200">
                            <span className="text-sm text-blue-600 font-medium shrink-0">
                              Publish End Date:
                            </span>
                            <span className="text-sm text-slate-800 text-right">
                              {formatPublishDate(event.endDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {event.latitude != null && event.longitude != null && (
                        <a
                          href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 hover:underline"
                        >
                          <svg
                            className="w-4 h-4 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          View map
                        </a>
                      )}
                    </div>
                    {/* About — event description (HTML) */}
                    <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                      {event.description &&
                      String(event.description).trim() !== "" ? (
                        <>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                            About
                          </p>
                          <div
                            className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-strong:font-semibold"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(event.description),
                            }}
                          />
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">Description not available.</p>
                      )}
                    </div>
                    {/* Documents — PDF/list with card layout */}
                    <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        Documents
                      </p>
                      {documents.length > 0 ? (
                        <div className="flex flex-wrap gap-4">
                          {documents.map((doc, i) => {
                            const url = doc.url || doc.fileUrl || doc.path || doc.document;
                            const href = url
                              ? url.startsWith("http")
                                ? url
                                : `${UPLOADS_URL}/${url}`
                              : null;
                            const name =
                              doc.name || doc.title || `Document ${i + 1}`;
                            const openDoc = (e) => {
                              if (!href) return;
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(href, "_blank", "noopener,noreferrer");
                            };
                            const cardClass =
                              "inline-flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 hover:border-primary/40 hover:bg-slate-100/80 transition-colors text-center min-w-[120px] max-w-[160px] p-4";
                            return (
                              <div key={doc.id || i}>
                                {href ? (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={openDoc}
                                    className={`${cardClass} cursor-pointer text-slate-800 no-underline`}
                                  >
                                    <span className="flex-shrink-0 w-20 h-24 flex items-center justify-center mb-2">
                                      <img src={pdfIcon} alt="PDF" className="w-full h-full object-contain" />
                                    </span>
                                    <span className="text-sm font-medium line-clamp-2">{name}</span>
                                  </a>
                                ) : (
                                  <div className={`${cardClass} text-slate-500 opacity-70`}>
                                    <span className="flex-shrink-0 w-20 h-24 flex items-center justify-center mb-2">
                                      <img src={pdfIcon} alt="PDF" className="w-full h-full object-contain" />
                                    </span>
                                    <span className="text-sm line-clamp-2">{name}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <InfoNotAvailable title="Documents" message="No documents available." />
                      )}
                    </div>
                    {/* Floor plan — image or placeholder */}
                    <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        Floor Plan
                      </p>
                      {event?.floorPlan ? (
                        <button
                          type="button"
                          onClick={() =>
                            setLightbox({
                              src: event.floorPlan.startsWith("http")
                                ? event.floorPlan
                                : `${UPLOADS_URL}/${event.floorPlan}`,
                              alt: "Floor plan",
                            })
                          }
                          className="rounded-xl overflow-hidden border border-slate-200 max-w-xl max-h-80 bg-slate-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <img
                            src={
                              event.floorPlan.startsWith("http")
                                ? event.floorPlan
                                : `${UPLOADS_URL}/${event.floorPlan}`
                            }
                            alt="Floor plan"
                            className="w-full h-full max-h-80 object-contain cursor-pointer hover:opacity-95 transition-opacity"
                          />
                        </button>
                      ) : (
                        <InfoNotAvailable title="Floor plan" message="No floor plan available." />
                      )}
                    </div>
                    {/* Event stamps — collectible stamps / booths */}
                    <div className="px-4 sm:px-5 pb-4 pt-4 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        Event Stamps
                      </p>
                      {event.eventStamps?.description && (
                        <div
                          className="text-sm text-slate-600 mb-3 prose prose-sm max-w-none prose-p:my-1"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(event.eventStamps.description),
                          }}
                        />
                      )}
                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-slate-600">
                        {event.eventStamps?.stampRequiredForReward != null && (
                          <span>
                            Stamps required for reward: <strong className="text-slate-800">{event.eventStamps.stampRequiredForReward}</strong>
                          </span>
                        )}
                        {event.eventStamps?.collectedCount != null && (
                          <span>
                            Collected: <strong className="text-slate-800">{event.eventStamps.collectedCount}</strong>
                            {event.eventStamps?.stampRequiredForReward != null && (
                              <span className="text-slate-500"> / {event.eventStamps.stampRequiredForReward}</span>
                            )}
                          </span>
                        )}
                      </div>
                      {eventStamps.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {eventStamps.map((stamp) => {
                            const imgSrc = stamp.image
                              ? stamp.image.startsWith("http")
                                ? stamp.image
                                : `${UPLOADS_URL}/${stamp.image}`
                              : null;
                            const displayName = stamp.name || stamp.boothNumber || "Stamp";
                            return (
                              <div
                                key={stamp.id}
                                className="rounded-xl border border-slate-200 p-3 text-center"
                              >
                                {imgSrc ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLightbox({
                                        src: imgSrc,
                                        alt: displayName,
                                      })
                                    }
                                    className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                                  >
                                    <img
                                      src={imgSrc}
                                      alt={displayName}
                                      className="w-16 h-16 mx-auto rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                  </button>
                                ) : (
                                  <div className="w-16 h-16 mx-auto rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                                    No image
                                  </div>
                                )}
                                <p className="font-medium text-slate-800 mt-2 text-sm">
                                  {displayName}
                                </p>
                                {stamp.boothNumber && stamp.name && stamp.boothNumber !== stamp.name && (
                                  <p className="text-xs text-slate-500">{stamp.boothNumber}</p>
                                )}
                                {stamp.isVisited != null && (
                                  <p className="text-xs mt-1">
                                    <span className={stamp.isVisited ? "text-emerald-600 font-medium" : "text-slate-500"}>
                                      {stamp.isVisited ? "Visited" : "Not visited"}
                                    </span>
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <InfoNotAvailable title="Event stamps" message="No event stamps available." />
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Speakers — list of SpeakerCard */}
                {currentTab === "speakers" && (
                  <div className="p-5">
                    {speakers.length > 0 ? (
                      <div className="space-y-6">
                        {speakers.map((s) => (
                          <SpeakerCard
                            key={s.id || s.name}
                            speaker={s}
                            uploadsUrl={UPLOADS_URL}
                            onImageClick={(src, alt) => setLightbox({ src, alt })}
                          />
                        ))}
                      </div>
                    ) : (
                      <InfoNotAvailable message="No speakers listed." variant="tab" />
                    )}
                  </div>
                )}

                {/* Tab: Gallery — EventGallery */}
                {currentTab === "gallery" && (
                  <EventGallery galleries={galleries} uploadsUrl={UPLOADS_URL} />
                )}

                {/* Tab: Exhibitors — EventExhibitors */}
                {currentTab === "exhibitors" && (
                  <EventExhibitors
                    exhibitorsData={exhibitorsData}
                    uploadsUrl={UPLOADS_URL}
                    onImageClick={(src, alt) => setLightbox({ src, alt })}
                  />
                )}

                {/* Tab: Register Info — EventRegistrationDetails (when user has registration) */}
                {currentTab === "register-info" && hasRegistration && (
                  <EventRegistrationDetails
                    registrationDetails={registrationDetails}
                    currency={currency}
                    section="all"
                  />
                )}

                {/* Tab: Survey — EventSurveyDetails */}
                {currentTab === "survey" && (
                  <EventSurveyDetails surveyDetails={event?.surveyDetails} />
                )}
              </div>
              {/* Full-screen image lightbox (shared across tabs) */}
              {lightbox.src && (
                <ImageLightbox
                  src={lightbox.src}
                  alt={lightbox.alt}
                  onClose={() => setLightbox({ src: null, alt: "" })}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
