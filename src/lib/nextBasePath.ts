/**
 * Next.js app base path from NEXT_PUBLIC_BASE_PATH (empty for root).
 * Marker for future Next `basePath` support; currently unused.
 */
export function getNextBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? ''
}
