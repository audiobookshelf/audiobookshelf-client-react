import {
  type CoverSize,
  fitCoverInBox,
  fitLandscapeCompactLayout,
  FULLSCREEN_COVER_INLINE_PADDING_MOBILE,
  LANDSCAPE_COMPACT_COL_MIN_WIDTH,
  LANDSCAPE_COMPACT_INLINE_PADDING,
  measureDesktopFullscreenContentWidth
} from '@/lib/player/coverFit'

const DEFAULT_ASPECT_RATIO = 1.6

export interface FullscreenCoverChrome {
  /** Distance from shell top to where main content may begin. */
  contentTopPx: number
  /** Distance from shell bottom to where main content may end. */
  contentBottomPx: number
  /** Horizontal shell padding — not the bottom safe-area. */
  paddingInlineStartPx?: number
  paddingInlineEndPx?: number
  columnGapPx?: number
}

export interface FullscreenCoverMeasureInput {
  shellWidth: number
  shellHeight: number
  aspectRatio: number
  isDesktop: boolean
  isLandscapeCompact: boolean
  chrome: FullscreenCoverChrome
  naturalSize?: CoverSize | null
  /** Measured width of the portrait controls block (track stack). */
  portraitContentMaxWidth?: number
}

function normalizedAspectRatio(aspectRatio: number): number {
  return aspectRatio > 0 ? aspectRatio : DEFAULT_ASPECT_RATIO
}

/** width / height for CSS `aspect-ratio`. */
export function coverWidthOverHeight(aspectRatio: number): number {
  const ar = normalizedAspectRatio(aspectRatio)
  return 1 / ar
}

export function measureFullscreenCoverMaxWidth({
  shellWidth,
  isDesktop,
  isLandscapeCompact,
  chrome,
  portraitContentMaxWidth
}: Pick<FullscreenCoverMeasureInput, 'shellWidth' | 'isDesktop' | 'isLandscapeCompact' | 'chrome' | 'portraitContentMaxWidth'>): number {
  if (isLandscapeCompact) {
    const paddingInlineStartPx = chrome.paddingInlineStartPx ?? LANDSCAPE_COMPACT_INLINE_PADDING
    const paddingInlineEndPx = chrome.paddingInlineEndPx ?? LANDSCAPE_COMPACT_INLINE_PADDING
    const columnGapPx = chrome.columnGapPx ?? LANDSCAPE_COMPACT_INLINE_PADDING
    return Math.max(48, shellWidth - paddingInlineStartPx - paddingInlineEndPx - columnGapPx - LANDSCAPE_COMPACT_COL_MIN_WIDTH)
  }

  if (isDesktop) {
    return portraitContentMaxWidth ?? measureDesktopFullscreenContentWidth(shellWidth)
  }

  return shellWidth - FULLSCREEN_COVER_INLINE_PADDING_MOBILE * 2
}

export function measureFullscreenCoverMaxHeight({
  shellHeight,
  chrome,
  reservedBelowCoverPx
}: {
  shellHeight: number
  chrome: FullscreenCoverChrome
  reservedBelowCoverPx: number
}): number {
  return Math.max(48, shellHeight - chrome.contentTopPx - chrome.contentBottomPx - reservedBelowCoverPx)
}

export function fitFullscreenCoverInRemainingSpace(input: FullscreenCoverMeasureInput & { reservedBelowCoverPx: number }) {
  if (input.isLandscapeCompact) {
    return fitLandscapeCompactLayout({
      shellWidth: input.shellWidth,
      shellHeight: input.shellHeight,
      aspectRatio: input.aspectRatio,
      chrome: input.chrome,
      naturalSize: input.naturalSize
    }).cover
  }

  const maxWidth = measureFullscreenCoverMaxWidth(input)
  const maxHeight = measureFullscreenCoverMaxHeight({
    shellHeight: input.shellHeight,
    chrome: input.chrome,
    reservedBelowCoverPx: input.reservedBelowCoverPx
  })

  return fitCoverInBox(maxWidth, maxHeight, input.aspectRatio, input.naturalSize)
}
