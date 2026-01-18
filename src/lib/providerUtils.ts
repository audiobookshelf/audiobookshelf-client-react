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
  let region = AudibleRegion.US // Default region
  if (provider?.toLowerCase().includes('audible')) {
    const possibleRegion = provider.split('.')?.pop()
    if (possibleRegion && Object.values(AudibleRegion).includes(possibleRegion as AudibleRegion)) {
      region = possibleRegion as AudibleRegion
    }
  }

  const upperRegion = region.toUpperCase() as AudibleRegion
  return Object.values(AudibleRegion).includes(upperRegion) ? upperRegion : AudibleRegion.US
}
