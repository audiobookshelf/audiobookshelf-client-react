import DOMPurify from 'isomorphic-dompurify'

/**
 * Escapes HTML characters in a string to prevent XSS attacks
 * @param text - The text to escape
 * @returns The escaped HTML string
 */
export const escapeHtml = (text: string): string => {
  if (typeof document === 'undefined') {
    // Fallback for server-side rendering or environments without document
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const allowedHtmlTags = [
  'p',
  'br',
  'hr',
  'blockquote',
  'pre',
  'code',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'em',
  'del',
  'a',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'img'
]
const allowedHtmlAttributes = ['href', 'title', 'src', 'alt', 'width', 'height']

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedHtmlTags,
    ALLOWED_ATTR: allowedHtmlAttributes
  })
}
