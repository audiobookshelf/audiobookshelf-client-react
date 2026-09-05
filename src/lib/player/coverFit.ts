export const PLAYER_DESKTOP_MIN_WIDTH = 1024
export const COVER_WIDTH_MINI_MOBILE = 56
export const COVER_WIDTH_MINI_DESKTOP = 77
/** Desktop portrait fullscreen: matches `player-shell.css` (75% / 48rem on controls). */
export const DESKTOP_FULLSCREEN_CONTENT_WIDTH_RATIO = 0.75
export const DESKTOP_FULLSCREEN_CONTENT_MAX_WIDTH_PX = 768
/** Horizontal inset for fullscreen cover on mobile portrait (each side). */
export const FULLSCREEN_COVER_INLINE_PADDING_MOBILE = 16
/** Landscape compact fullscreen: matches `player-shell.css` (--player-landscape-*). */
export const LANDSCAPE_COMPACT_INLINE_PADDING = 16
export const LANDSCAPE_COMPACT_CONTENT_TOP = 52
/** Fullscreen transport row: 4×3rem + 4rem play + 4×1rem gaps (16px rem). */
export const LANDSCAPE_COMPACT_TRANSPORT_MIN_WIDTH = 320
/** Secondary toolbar: 7×2.75rem buttons + 6×0.75rem gaps (widest configuration). */
export const LANDSCAPE_COMPACT_SECONDARY_MIN_WIDTH = 380
/** Controls column must fit transport and secondary rows without clipping. */
export const LANDSCAPE_COMPACT_COL_MIN_WIDTH = LANDSCAPE_COMPACT_SECONDARY_MIN_WIDTH
export const PLAYER_SWIPE_THRESHOLD_PX = 100

const DEFAULT_ASPECT_RATIO = 1.6
const LANDSCAPE_COMPACT_MAX_HEIGHT = 600

export interface CoverSize {
  width: number
  height: number
}

export interface FullscreenCoverFitInput {
  viewportWidth: number
  viewportHeight: number
  /** Cover height / width (1 for square, 1.6 for standard). */
  aspectRatio: number
  isDesktop: boolean
  naturalSize?: CoverSize | null
}

function normalizedAspectRatio(aspectRatio: number): number {
  return aspectRatio > 0 ? aspectRatio : DEFAULT_ASPECT_RATIO
}

export function isDesktopViewport(viewportWidth: number): boolean {
  return viewportWidth >= PLAYER_DESKTOP_MIN_WIDTH
}

export function isLandscapeCompactViewport(viewportWidth: number, viewportHeight: number): boolean {
  return viewportHeight <= LANDSCAPE_COMPACT_MAX_HEIGHT && viewportWidth > viewportHeight
}

export function measureDesktopFullscreenContentWidth(shellWidth: number): number {
  return Math.min(Math.round(shellWidth * DESKTOP_FULLSCREEN_CONTENT_WIDTH_RATIO), DESKTOP_FULLSCREEN_CONTENT_MAX_WIDTH_PX)
}

/** Mini player cover height matches square cover width so the bar stays the same height for 1.6 and 1:1. */
export function miniCoverSize(aspectRatio: number, isDesktop: boolean): CoverSize {
  const height = isDesktop ? COVER_WIDTH_MINI_DESKTOP : COVER_WIDTH_MINI_MOBILE
  const width = Math.round(height / normalizedAspectRatio(aspectRatio))
  return { width, height }
}

export function fitCoverInBox(maxWidth: number, maxHeight: number, aspectRatio: number, naturalSize?: CoverSize | null): CoverSize {
  const ar = normalizedAspectRatio(aspectRatio)
  let widthLimit = Math.max(48, maxWidth)
  let heightLimit = Math.max(48, maxHeight)

  if (naturalSize && naturalSize.width > 0 && naturalSize.height > 0) {
    widthLimit = Math.min(widthLimit, naturalSize.width)
    heightLimit = Math.min(heightLimit, naturalSize.height)
  }

  let width = widthLimit
  let height = width * ar
  if (height > heightLimit) {
    height = heightLimit
    width = height / ar
  }

  return { width: Math.round(width), height: Math.round(height) }
}

export interface LandscapeCompactLayout {
  cover: CoverSize
  columnWidth: number
}

export interface LandscapeCompactChrome {
  contentTopPx: number
  contentBottomPx: number
  /** Horizontal shell padding (not bottom safe-area). Defaults to landscape inline pad. */
  paddingInlineStartPx?: number
  paddingInlineEndPx?: number
  columnGapPx?: number
}

export interface LandscapeCompactLayoutInput {
  shellWidth: number
  shellHeight: number
  aspectRatio: number
  chrome: LandscapeCompactChrome
  naturalSize?: CoverSize | null
}

function landscapeCompactInlineMetrics(chrome: LandscapeCompactChrome) {
  return {
    paddingInlineStartPx: chrome.paddingInlineStartPx ?? LANDSCAPE_COMPACT_INLINE_PADDING,
    paddingInlineEndPx: chrome.paddingInlineEndPx ?? LANDSCAPE_COMPACT_INLINE_PADDING,
    columnGapPx: chrome.columnGapPx ?? LANDSCAPE_COMPACT_INLINE_PADDING
  }
}

/** Split landscape row width between cover (height-capped) and controls column (min width for buttons). */
export function fitLandscapeCompactLayout(input: LandscapeCompactLayoutInput): LandscapeCompactLayout {
  const { paddingInlineStartPx, paddingInlineEndPx, columnGapPx } = landscapeCompactInlineMetrics(input.chrome)
  const availW = input.shellWidth - paddingInlineStartPx - paddingInlineEndPx - columnGapPx
  const maxH = Math.max(48, input.shellHeight - input.chrome.contentTopPx - input.chrome.contentBottomPx)

  let cover = fitCoverInBox(Math.max(48, availW - LANDSCAPE_COMPACT_COL_MIN_WIDTH), maxH, input.aspectRatio, input.naturalSize)
  let columnWidth = availW - cover.width

  if (columnWidth < LANDSCAPE_COMPACT_COL_MIN_WIDTH) {
    columnWidth = Math.min(LANDSCAPE_COMPACT_COL_MIN_WIDTH, availW - 48)
    cover = fitCoverInBox(Math.max(48, availW - columnWidth), maxH, input.aspectRatio, input.naturalSize)
    columnWidth = availW - cover.width
  }

  return { cover, columnWidth }
}

export function fitFullscreenCoverSize({ viewportWidth, viewportHeight, aspectRatio, isDesktop, naturalSize }: FullscreenCoverFitInput): CoverSize {
  const ar = normalizedAspectRatio(aspectRatio)
  const landscapeCompact = isLandscapeCompactViewport(viewportWidth, viewportHeight)

  if (landscapeCompact) {
    const { cover } = fitLandscapeCompactLayout({
      shellWidth: viewportWidth,
      shellHeight: viewportHeight,
      aspectRatio: ar,
      chrome: {
        contentTopPx: LANDSCAPE_COMPACT_CONTENT_TOP,
        contentBottomPx: LANDSCAPE_COMPACT_INLINE_PADDING
      },
      naturalSize
    })
    return cover
  }

  const reservedBottom = isDesktop ? 280 : 300
  const reservedTop = 56
  let maxWidth: number
  if (isDesktop) {
    maxWidth = measureDesktopFullscreenContentWidth(viewportWidth)
  } else {
    maxWidth = viewportWidth - FULLSCREEN_COVER_INLINE_PADDING_MOBILE * 2
  }
  const maxHeight = Math.max(80, viewportHeight - reservedBottom - reservedTop)

  return fitCoverInBox(maxWidth, maxHeight, ar, naturalSize)
}
