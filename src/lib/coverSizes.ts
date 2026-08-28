/** Available cover sizes in pixels */
export const AVAILABLE_COVER_SIZES = [60, 80, 100, 120, 140, 160, 180, 200, 220]
export const NUM_AVAILABLE_COVER_SIZES = AVAILABLE_COVER_SIZES.length
export const NUM_AVAILABLE_MOBILE_COVER_SIZES = 3
/** Cover width the size multiplier is relative to */
const BASE_COVER_SIZE = 120
const DEFAULT_SIZE_INDEX = 3
const DEFAULT_MOBILE_SIZE_INDEX = 2

/** Resolves a saved cover width to a valid size index for the viewport, falling back to the default */
export function coverSizeToIndex(width: number | undefined, isMobile: boolean): number {
  const numAvailable = isMobile ? NUM_AVAILABLE_MOBILE_COVER_SIZES : NUM_AVAILABLE_COVER_SIZES
  const fallbackIndex = isMobile ? DEFAULT_MOBILE_SIZE_INDEX : DEFAULT_SIZE_INDEX
  if (width === undefined) return fallbackIndex
  const index = AVAILABLE_COVER_SIZES.indexOf(width)
  return index === -1 || index >= numAvailable ? fallbackIndex : index
}

export function coverSizeToMultiplier(width: number | undefined, isMobile: boolean): number {
  return AVAILABLE_COVER_SIZES[coverSizeToIndex(width, isMobile)] / BASE_COVER_SIZE
}
