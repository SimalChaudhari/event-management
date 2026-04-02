import React from 'react';
import { getEventImageUrl } from '../../utils/eventImageUtils';
import { API_URL, DUMMY_PATH } from '../../configs/env';

/**
 * Reusable event image for admin panel.
 * Resolves event.images[0] or any path/URL (including Salesforce/external URLs) to a displayable img src.
 * Use this so all event image display logic stays in one place (eventImageUtils).
 *
 * @param {string} image - Image path or full URL (e.g. event.images?.[0])
 * @param {string} [alt] - Alt text
 * @param {string} [className] - Optional class for the img
 * @param {string} [apiUrl] - Override API base URL (default: API_URL from env)
 * @param {string} [fallback] - URL when image is empty (default: DUMMY_PATH)
 * @param {Object} [imgProps] - Any other img attributes (style, onError, etc.)
 */
export default function EventImage({
    image,
    alt = 'Event',
    className = '',
    apiUrl = API_URL,
    fallback = DUMMY_PATH,
    ...imgProps
}) {
    const src = getEventImageUrl(image, { apiUrl, fallback });
    return <img src={src} alt={alt} className={className} {...imgProps} />;
}
