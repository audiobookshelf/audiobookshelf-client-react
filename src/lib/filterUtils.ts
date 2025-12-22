'use client'

/**
 * Filter encoding utilities for library filter values.
 * Matches the Vue implementation's $encode and $decode functions.
 */

/**
 * Encode a string to base64, handling Unicode characters properly.
 */
function utf8ToBase64(text: string): string {
  if (typeof window !== 'undefined') {
    // Browser: Use TextEncoder to get UTF-8 bytes, then convert to base64
    const encoder = new TextEncoder()
    const bytes = encoder.encode(text)
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
    return btoa(binary)
  }
  return Buffer.from(text, 'utf-8').toString('base64')
}

/**
 * Decode a base64 string to UTF-8, handling Unicode characters properly.
 */
function base64ToUtf8(base64: string): string {
  if (typeof window !== 'undefined') {
    // Browser: Decode base64 to binary, then use TextDecoder for UTF-8
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  }
  return Buffer.from(base64, 'base64').toString('utf-8')
}

/**
 * Encode a filter value for use in API queries.
 * Converts text to base64 then URL-encodes it.
 */
export function filterEncode(text: string): string {
  const base64 = utf8ToBase64(text)
  return encodeURIComponent(base64)
}

/**
 * Decode a filter value from API format.
 * URL-decodes then converts from base64.
 */
export function filterDecode(text: string): string {
  const decoded = decodeURIComponent(text)
  return base64ToUtf8(decoded)
}
