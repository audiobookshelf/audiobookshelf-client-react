/** Never let the artwork collapse while the stage is still being measured */
export const MIN_COVER_WIDTH = 64
export const MAX_COVER_WIDTH = 420

export interface FitCoverWidthParams {
  /** Width available to the artwork, excluding the stage's own padding */
  availableWidth: number
  /** Height available to the artwork, excluding the stage's padding and anything below it */
  availableHeight: number
  /** Cover height divided by cover width */
  coverAspectRatio: number
}

/**
 * Largest artwork width that fits the stage in both axes.
 *
 * Both limits are hard: a narrow viewport shrinks the artwork rather than letting it push
 * past the stage edge, and a short one (a phone in landscape) shrinks it rather than
 * letting it run off the bottom. The only floor is {@link MIN_COVER_WIDTH}, which exists
 * so a stage that has not been measured yet does not render a zero-sized image.
 */
export function fitCoverWidth({ availableWidth, availableHeight, coverAspectRatio }: FitCoverWidthParams): number {
  if (!Number.isFinite(coverAspectRatio) || coverAspectRatio <= 0) return MIN_COVER_WIDTH

  const widthLimit = Number.isFinite(availableWidth) ? availableWidth : 0
  const heightLimit = Number.isFinite(availableHeight) ? availableHeight / coverAspectRatio : 0

  return Math.max(MIN_COVER_WIDTH, Math.min(MAX_COVER_WIDTH, widthLimit, heightLimit))
}
