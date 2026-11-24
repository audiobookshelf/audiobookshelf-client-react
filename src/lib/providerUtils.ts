import { Library } from '@/types/api'

export enum AudibleRegion {
  US = 'us',
  CA = 'ca',
  UK = 'uk',
  AU = 'au',
  FR = 'fr',
  DE = 'de',
  JP = 'jp',
  IT = 'it',
  IN = 'in',
  ES = 'es'
}

export const getProviderRegion = (provider: Library['provider']): AudibleRegion => {
  const normalized = provider?.toLowerCase()
  if (!normalized?.includes('audible')) return AudibleRegion.US

  const possibleRegion = normalized.split('.').pop()
  if (possibleRegion && Object.values(AudibleRegion).includes(possibleRegion as AudibleRegion)) {
    return possibleRegion as AudibleRegion
  }
  return AudibleRegion.US
}
