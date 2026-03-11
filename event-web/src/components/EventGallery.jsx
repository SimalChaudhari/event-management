import { useState } from "react";
import ImageLightbox from "./ImageLightbox";
import InfoNotAvailable from "./InfoNotAvailable";

/**
 * Resolve full image URL from item (string path or object with url).
 * @param {string|{ url?: string }} img
 * @param {string} uploadsUrl
 * @returns {string|null}
 */
function getImageSrc(img, uploadsUrl) {
  if (!img) return null;
  const url = typeof img === "string" ? img : img?.url;
  if (!url) return null;
  return url.startsWith("http") ? url : `${uploadsUrl}/${url}`;
}

/**
 * Reusable gallery component: displays gallery groups with clickable images
 * and a lightbox for full-size view.
 *
 * @param {{ galleries: Array<{ id?: string; trackTitle?: string; galleryImages?: Array<string|{ url?: string }> }>, uploadsUrl: string }} props
 */
export default function EventGallery({ galleries = [], uploadsUrl = "" }) {
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxAlt, setLightboxAlt] = useState("");

  const openLightbox = (src, alt = "Image") => {
    setLightboxImage(src);
    setLightboxAlt(alt);
  };
  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxAlt("");
  };

  if (galleries.length === 0) {
    return (
      <div className="p-5 sm:p-6">
        <InfoNotAvailable title="Gallery" message="No gallery images available." variant="tab" />
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6">
      {galleries.map((gallery) => {
        const images = (gallery.galleryImages ?? [])
          .map((img) => getImageSrc(img, uploadsUrl))
          .filter(Boolean);
        if (images.length === 0) return null;

        const title = gallery.trackTitle || "Gallery";

        return (
          <section
            key={gallery.id ?? title}
            className="mb-10 last:mb-0"
          >
            <h2 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
              {title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {images.map((src, i) => (
                <button
                  key={`${gallery.id ?? ""}-${i}`}
                  type="button"
                  onClick={() => openLightbox(src, `${title} ${i + 1}`)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <img
                    src={src}
                    alt={`${title} ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" aria-hidden />
                </button>
              ))}
            </div>
          </section>
        );
      })}

      <ImageLightbox src={lightboxImage} alt={lightboxAlt} onClose={closeLightbox} />
    </div>
  );
}
