import DOMPurify from 'dompurify';

/**
 * Sanitizes rich text HTML using DOMPurify to prevent XSS.
 * Section 16 & Section 20 Security requirement.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';
  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'code',
      'pre',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}
