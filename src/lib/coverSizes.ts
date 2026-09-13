/** Available cover sizes in pixels */
export const AVAILABLE_COVER_SIZES = [60, 80, 100, 120, 140, 160, 180, 200, 220]
export const NUM_AVAILABLE_COVER_SIZES = AVAILABLE_COVER_SIZES.length
/** Cover width the size multiplier is relative to */
const BASE_COVER_SIZE = 120
const DEFAULT_SIZE_INDEX = 3

/** A saved width that is no longer an available size falls back to the default */
export function coverSizeToIndex(width: number | null | undefined): number {
  if (width == null) return DEFAULT_SIZE_INDEX
  const index = AVAILABLE_COVER_SIZES.indexOf(width)
  return index === -1 ? DEFAULT_SIZE_INDEX : index
}

export function coverSizeToMultiplier(width: number | null | undefined): number {
  return AVAILABLE_COVER_SIZES[coverSizeToIndex(width)] / BASE_COVER_SIZE
}

/** A cookie value that is not an available size is ignored */
export function parseCoverSize(value: string | undefined): number | undefined {
  const width = Number(value)
  return AVAILABLE_COVER_SIZES.includes(width) ? width : undefined
}
