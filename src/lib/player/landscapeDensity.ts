/** Landscape fullscreen density: 0 = full UI, higher = more compaction (A → B → C → D). */
export type LandscapeDensityLevel = 0 | 1 | 2 | 3 | 4

export const LANDSCAPE_DENSITY_MAX_LEVEL = 4

function parseCssLengthPx(value: string, rootFontSize: number): number {
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'normal') return 0
  if (trimmed.endsWith('rem')) return parseFloat(trimmed) * rootFontSize
  if (trimmed.endsWith('px')) return parseFloat(trimmed)
  return parseFloat(trimmed) || 0
}

/** Sum of child scroll heights + flex gaps — not container scrollHeight (flex-shrink hides overflow). */
export function measureRightColumnContentHeight(rightColumn: HTMLElement): number {
  const style = getComputedStyle(rightColumn)
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const gap = parseCssLengthPx(style.rowGap || style.gap || '0', rootFontSize)
  const children = Array.from(rightColumn.children) as HTMLElement[]
  if (children.length === 0) return 0

  const heights = children.reduce((sum, child) => sum + child.scrollHeight, 0)
  return heights + gap * (children.length - 1)
}

export function rightColumnContentOverflows(rightColumn: HTMLElement, tolerancePx = 1): boolean {
  const children = Array.from(rightColumn.children) as HTMLElement[]
  if (children.some((child) => child.scrollHeight > child.clientHeight + tolerancePx)) {
    return true
  }

  return measureRightColumnContentHeight(rightColumn) > rightColumn.clientHeight + tolerancePx
}

export interface LandscapeDensityFlags {
  /** D: hide secondary toolbar row (last resort) */
  overflowSecondaryToolbar: boolean
  /** A: single progress bar */
  singleTrackBar: boolean
  /** B: chapter label below seek bar */
  chapterLabelBelow: boolean
  /** C: title only (hide author and duration) */
  compactTitle: boolean
}

export function landscapeDensityFlags(level: LandscapeDensityLevel): LandscapeDensityFlags {
  return {
    overflowSecondaryToolbar: level >= 4,
    singleTrackBar: level >= 1,
    chapterLabelBelow: level >= 2,
    compactTitle: level >= 3
  }
}
