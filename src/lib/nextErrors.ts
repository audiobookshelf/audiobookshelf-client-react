/**
 * Next.js `redirect()` throws a special error with NEXT_REDIRECT in the digest.
 * Re-throw these instead of treating them as failures in try/catch blocks.
 */
export function isNextRedirectError(error: unknown): boolean {
  return !!(error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT'))
}
