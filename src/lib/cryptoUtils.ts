const UINT32_RANGE = 2 ** 32

/**
 * `count` cryptographically secure integers in [min, max).
 * `max` is exclusive.
 *
 * Values in the leftover tail of the 32-bit range are discarded so the result is uniform.
 */
export function getRandomInts(count: number, max: number, min = 0): number[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative integer')
  }
  if (!Number.isInteger(min) || !Number.isInteger(max) || max <= min) {
    throw new RangeError('max must be an integer greater than min')
  }

  const span = max - min
  if (span > UINT32_RANGE) {
    throw new RangeError('range must be at most 2^32')
  }
  if (count === 0) return []

  const limit = UINT32_RANGE - (UINT32_RANGE % span)
  const result: number[] = []
  const values = new Uint32Array(count)

  while (result.length < count) {
    crypto.getRandomValues(values)
    for (const value of values) {
      if (value >= limit) continue
      result.push(min + (value % span))
      if (result.length === count) break
    }
  }

  return result
}

/**
 * Generate a UUID that works in all contexts, including non-HTTPS.
 * Prefers the native crypto.randomUUID() when available (secure contexts),
 * and falls back to crypto.getRandomValues() otherwise.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for non-secure contexts (e.g. plain HTTP in production)
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16))
}
