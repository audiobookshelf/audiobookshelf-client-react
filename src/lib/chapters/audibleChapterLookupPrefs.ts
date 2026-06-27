import type { BookMetadata } from '@/types/api'

export const AUDIBLE_REGIONS = ['US', 'CA', 'UK', 'AU', 'FR', 'DE', 'JP', 'IT', 'IN', 'ES'] as const

export type AudibleRegion = (typeof AUDIBLE_REGIONS)[number]

const AUDIBLE_REGION_STORAGE_KEY = 'audibleRegion'
const DEFAULT_AUDIBLE_REGION: AudibleRegion = 'US'

/** Region persisted from the last Audible chapter lookup (Vue `chapters.vue` behavior). */
export function getStoredAudibleRegion(): AudibleRegion {
  if (typeof window === 'undefined') {
    return DEFAULT_AUDIBLE_REGION
  }

  const stored = localStorage.getItem(AUDIBLE_REGION_STORAGE_KEY)
  if (stored && (AUDIBLE_REGIONS as readonly string[]).includes(stored)) {
    return stored as AudibleRegion
  }

  return DEFAULT_AUDIBLE_REGION
}

export function setStoredAudibleRegion(region: string): void {
  if (typeof window === 'undefined') {
    return
  }

  if ((AUDIBLE_REGIONS as readonly string[]).includes(region)) {
    localStorage.setItem(AUDIBLE_REGION_STORAGE_KEY, region)
  }
}

/** Initial ASIN for chapter lookup, from book metadata when present. */
export function getInitialAsinFromMetadata(metadata: Pick<BookMetadata, 'asin'> | undefined): string {
  const asin = metadata?.asin
  return typeof asin === 'string' ? asin.trim() : ''
}
