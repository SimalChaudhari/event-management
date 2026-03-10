import DOMPurify from 'dompurify';

/**
 * Sanitize HTML for safe use with dangerouslySetInnerHTML.
 * Allows common content tags and strips scripts/events.
 */
export function sanitizeHtml(html) {
  if (html == null || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html.trim(), {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
      'ul', 'ol', 'li', 'a', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}
