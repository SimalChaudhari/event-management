import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UPLOADS_URL } from '../config';
import { fetchBannerEvents } from '../store/actions/bannerActions';

const title = 'THIS NOVEMBER 27';
const subtitle = 'Live Conference of FIGMA, 9:00AM - 5:30PM';

export default function Banner() {
  const dispatch = useDispatch();
  const { data: bannerData, loading } = useSelector((state) => state.banner);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
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

  if (loading) {
    return (
      <section className="w-full mb-5 bg-gradient-to-b from-slate-200 to-slate-300 px-4 py-10 min-h-[38vh] md:min-h-[42vh] flex items-center justify-center rounded-b-[20px] md:mb-8 md:rounded-b-3xl">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-800 tracking-wide mb-1 md:text-3xl">{title}</p>
          <p className="text-sm text-slate-600 mb-4 md:text-base">{subtitle}</p>
          <div className="flex justify-center gap-2">
            <span className="w-6 h-2 rounded bg-primary" />
            <span className="w-2 h-2 rounded-full bg-black/20" />
            <span className="w-2 h-2 rounded-full bg-black/20" />
          </div>
        </div>
      </section>
    );
  }

  if (banner && banner.imageUrls && banner.imageUrls.length > 0) {
    const urls = banner.imageUrls;
    const hyperlinks = banner.hyperlinks || [];
    const currentUrl = urls[activeIndex];
    const fullImageUrl = currentUrl.startsWith('http') ? currentUrl : `${UPLOADS_URL}/${currentUrl}`;
    const link = hyperlinks[activeIndex];

    return (
      <section className="w-full mb-5 rounded-b-[20px] overflow-hidden md:mb-8 md:rounded-b-3xl">
        <div className="relative w-full min-h-[38vh] md:min-h-[42vh] bg-slate-200">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="block w-full h-full absolute inset-0">
              <img
                src={fullImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </a>
          ) : (
            <img
              src={fullImageUrl}
              alt=""
              className="w-full h-full object-cover absolute inset-0"
            />
          )}
        </div>
        {urls.length > 1 && (
          <div className="flex justify-center gap-2 py-2 bg-gradient-to-b from-slate-200 to-slate-300">
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`h-2 rounded transition-all ${
                  i === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-black/20'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="w-full mb-5 bg-gradient-to-b from-slate-200 to-slate-300 px-4 py-10 min-h-[38vh] md:min-h-[42vh] flex items-center justify-center rounded-b-[20px] md:mb-8 md:rounded-b-3xl">
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-800 tracking-wide mb-1 md:text-3xl">{title}</p>
        <p className="text-sm text-slate-600 mb-4 md:text-base">{subtitle}</p>
        <div className="flex justify-center gap-2">
          <span className="w-6 h-2 rounded bg-primary" />
          <span className="w-2 h-2 rounded-full bg-black/20" />
          <span className="w-2 h-2 rounded-full bg-black/20" />
        </div>
      </div>
    </section>
  );
}
