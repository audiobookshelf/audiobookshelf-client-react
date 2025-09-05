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
