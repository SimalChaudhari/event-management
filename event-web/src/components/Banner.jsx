import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UPLOADS_URL } from '../config';
import { fetchBannerEvents } from '../store/actions/bannerActions';

const DEFAULT_TITLE = 'THIS NOVEMBER 27';
const DEFAULT_SUBTITLE = 'Live Conference of FIGMA, 9:00AM - 5:30PM';
const AUTO_SCROLL_INTERVAL_MS = 5000;

export default function Banner() {
  const dispatch = useDispatch();
  const { data: bannerData, loading } = useSelector((state) => state.banner);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const fetched = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    dispatch(fetchBannerEvents());
  }, [dispatch]);

  const banner = (() => {
    if (!bannerData?.imageUrls) return null;
    const urls = Array.isArray(bannerData.imageUrls)
      ? bannerData.imageUrls
      : String(bannerData.imageUrls).split(',').map((s) => s.trim()).filter(Boolean);
    if (urls.length === 0) return null;
    const hyperlinks = Array.isArray(bannerData.hyperlinks)
      ? bannerData.hyperlinks
      : bannerData.hyperlinks
        ? String(bannerData.hyperlinks).split(',').map((s) => s.trim())
        : [];
    return { ...bannerData, imageUrls: urls, hyperlinks };
  })();

  const totalSlides = banner?.imageUrls?.length ?? 0;

  const goToSlide = useCallback((index) => {
    if (totalSlides <= 0) return;
    setActiveIndex((index + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-scroll: advance every AUTO_SCROLL_INTERVAL_MS when not paused
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, AUTO_SCROLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalSlides, isPaused]);

  if (loading) {
    return (
      <section
        className="w-full mb-5 bg-gradient-to-b from-slate-200 to-slate-300 px-4 py-10 min-h-[38vh] md:min-h-[42vh] flex items-center justify-center rounded-b-[20px] md:mb-8 md:rounded-b-3xl"
        aria-label="Banner loading"
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-800 tracking-wide mb-1 md:text-3xl">{DEFAULT_TITLE}</p>
          <p className="text-sm text-slate-600 mb-4 md:text-base">{DEFAULT_SUBTITLE}</p>
          <div className="flex justify-center gap-2">
            <span className="w-6 h-2 rounded bg-primary" />
            <span className="w-2 h-2 rounded-full bg-black/20" />
            <span className="w-2 h-2 rounded-full bg-black/20" />
          </div>
        </div>
      </section>
    );
  }

  if (banner?.imageUrls?.length > 0) {
    const urls = banner.imageUrls;
    const hyperlinks = banner.hyperlinks || [];

    return (
      <section
        className="w-full mb-5 rounded-b-[20px] overflow-hidden md:mb-8 md:rounded-b-3xl"
        aria-label="Promotional banner carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <div className="relative w-full min-h-[38vh] md:min-h-[42vh] bg-slate-200">
          {urls.map((url, i) => {
            const fullUrl = url.startsWith('http') ? url : `${UPLOADS_URL}/${url}`;
            const href = hyperlinks[i];
            const isActive = i === activeIndex;
            return (
              <div
                key={i}
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${i + 1} of ${urls.length}`}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                  >
                    <img
                      src={fullUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading={isActive ? 'eager' : 'lazy'}
                    />
                  </a>
                ) : (
                  <img
                    src={fullUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading={isActive ? 'eager' : 'lazy'}
                  />
                )}
              </div>
            );
          })}

          {urls.length > 1 && (
            <div
              className="absolute bottom-3 left-0 right-0 z-20 flex justify-center items-center gap-2"
              role="tablist"
              aria-label="Banner slides"
            >
              {urls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === activeIndex}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goToSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent ${
                    i === activeIndex ? 'bg-white opacity-100' : 'bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full mb-5 bg-gradient-to-b from-slate-200 to-slate-300 px-4 py-10 min-h-[38vh] md:min-h-[42vh] flex items-center justify-center rounded-b-[20px] md:mb-8 md:rounded-b-3xl"
      aria-label="Banner placeholder"
    >
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-800 tracking-wide mb-1 md:text-3xl">{DEFAULT_TITLE}</p>
        <p className="text-sm text-slate-600 mb-4 md:text-base">{DEFAULT_SUBTITLE}</p>
        <div className="flex justify-center gap-2">
          <span className="w-6 h-2 rounded bg-primary" />
          <span className="w-2 h-2 rounded-full bg-black/20" />
          <span className="w-2 h-2 rounded-full bg-black/20" />
        </div>
      </div>
    </section>
  );
}
