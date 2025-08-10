/**
 * Utility functions for clipboard operations with fallback support
 */

/**
 * Copies text to clipboard using modern Clipboard API with fallback for older browsers
 * @param text - The text to copy to clipboard
 * @returns Promise<void> - Throws error if copy fails
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Try the modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Fallback for older browsers or non-secure contexts
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  const successful = document.execCommand('copy')
  document.body.removeChild(textArea)

  if (!successful) {
    throw new Error('Failed to copy to clipboard using fallback method')
  }
}
