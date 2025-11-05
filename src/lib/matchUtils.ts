import { BookSearchResult, PodcastSearchResult } from '@/types/api'

/**
 * Converts string values to arrays for array fields in match data
 */
function processArrayFields<T>(processed: T, arrayFields: (keyof T)[]): T {
  for (const field of arrayFields) {
    if (processed[field] && !Array.isArray(processed[field])) {
      processed[field] = String(processed[field])
        .split(',')
        .map((g) => g.trim())
        .filter((g) => !!g) as T[keyof T]
    }
  }
  return processed
}

/**
 * Processes book match data on initialization
 * Converts string values to arrays for genres, tags, narrator
 * Removes empty series arrays
 */
export function processBookMatchData(match: BookSearchResult): BookSearchResult {
  const processed: BookSearchResult = { ...match }

  // Process series
  if (processed.series && (!Array.isArray(processed.series) || processed.series.length === 0)) {
    delete processed.series
  }

  // Process genres, tags, narrator - convert string to array if needed
  return processArrayFields(processed, ['genres', 'tags', 'narrator'] as (keyof BookSearchResult)[])
}

/**
 * Processes podcast match data on initialization
 * Converts string values to arrays for genres, tags
 */
export function processPodcastMatchData(match: PodcastSearchResult): PodcastSearchResult {
  const processed: PodcastSearchResult = { ...match }
  return processArrayFields(processed, ['genres', 'tags'] as (keyof PodcastSearchResult)[])
}

/**
 * Type-safe helper to get string values from match data
 */
export function getMatchStringValue<T>(match: T | undefined, field: keyof T, fallback = ''): string {
  const value = match?.[field]
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return fallback
}

/**
 * Type-safe helper to get boolean values from match data
 */
export function getMatchBooleanValue<T>(match: T | undefined, field: keyof T, fallback = false): boolean {
  const value = match?.[field]
  if (typeof value === 'boolean') return value
  return fallback
}
