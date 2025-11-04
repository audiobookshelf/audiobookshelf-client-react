/**
 * Utility functions for working with JWT tokens
 */

interface JWTPayload {
  exp?: number
  iat?: number
  [key: string]: unknown
}

/**
 * Decodes a JWT token without verifying the signature
 * This is safe for checking expiration since we only use it for client-side routing
 * The server will still verify the signature when making API calls
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    // Handle URL-safe base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)))

    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Checks if a JWT token is expired
 * @param token - The JWT token string
 * @param bufferSeconds - Optional buffer time in seconds to consider token expired early (default: 0)
 * @returns true if token is expired or invalid, false if still valid
 */
export function isTokenExpired(token: string, bufferSeconds: number = 0): boolean {
  const payload = decodeJWT(token)

  if (!payload || typeof payload.exp !== 'number') {
    // If we can't decode or there's no exp claim, consider it expired
    return true
  }

  const now = Math.floor(Date.now() / 1000)
  return payload.exp - bufferSeconds <= now
}
