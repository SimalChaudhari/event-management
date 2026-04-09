/**
 * Reusable event image URL resolution for the admin panel.
 * Use this everywhere we display event.images[0] or any event image path
 * so that Salesforce/external URLs and local upload paths are handled in one place.
 *
 * @param {string | undefined | null} image - Image path or full URL (e.g. from event.images[0])
 * @param {Object} options
 * @param {string} options.apiUrl - Base API URL for local paths (e.g. API_URL from configs/env)
 * @param {string} [options.fallback] - URL to return when image is empty (e.g. DUMMY_PATH)
 * @returns {string} Full URL to use as img src
 */
export function getEventImageUrl(image, { apiUrl, fallback = '' } = {}) {
    if (image == null || image === '') {
        return fallback;
    }
    const str = String(image).trim();
    if (!str) return fallback;
    // External URL (e.g. Salesforce imageUrl) – use as-is
    if (str.startsWith('http://') || str.startsWith('https://')) {
        return str;
    }
    // Local path – prepend API base URL
    const base = (apiUrl || '').replace(/\/+$/, '');
    const path = str.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    return path ? `${base}/${path}` : fallback;
}
