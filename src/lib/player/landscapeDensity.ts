/** Landscape fullscreen compaction. Each step keeps the ones before it (A → B → C → D). */
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

type LandscapeDensityLevel = 0 | 1 | 2 | 3 | 4

const LANDSCAPE_DENSITY_MAX_LEVEL = 4
const LANDSCAPE_DENSITY_LEVELS: LandscapeDensityLevel[] = [0, 1, 2, 3, 4]

/** Chapter-track column totals. Levels 0–2 differ by the second bar and the chapter label. */
const CHAPTER_COLUMN_TOKENS = ['--fs-col-0', '--fs-col-1', '--fs-col-2', '--fs-col-3', '--fs-col-4']
/** Book track with chapters: one bar, but the chapter label still sits above it until level 2. */
const CHAPTER_LABEL_COLUMN_TOKENS = ['--fs-col-1', '--fs-col-1', '--fs-col-2', '--fs-col-3', '--fs-col-4']
/** Without chapters, levels 0–2 are the same single bar. */
const BOOK_COLUMN_TOKENS = ['--fs-col-book', '--fs-col-book', '--fs-col-book', '--fs-col-book-3', '--fs-col-book-4']

function landscapeDensityFlags(level: LandscapeDensityLevel): LandscapeDensityFlags {
  return {
    overflowSecondaryToolbar: level >= 4,
    singleTrackBar: level >= 1,
    chapterLabelBelow: level >= 2,
    compactTitle: level >= 3
  }
}

/** Lowest density whose token height fits the column budget. Heights are `--fs-col-*` in pixels. */
function fittingLandscapeDensityLevel(columnHeightsPx: number[], budgetPx: number): LandscapeDensityLevel {
  for (const level of LANDSCAPE_DENSITY_LEVELS) {
    const height = columnHeightsPx[level]
    if (height != null && height <= budgetPx + 1) return level
  }
  return LANDSCAPE_DENSITY_MAX_LEVEL
}

function cssLengthPx(style: CSSStyleDeclaration, name: string): number {
  return parseFloat(style.getPropertyValue(name)) || 0
}

export function landscapeDensityFromShell(shell: HTMLElement, chapterTrack: boolean, hasChapters: boolean): LandscapeDensityFlags {
  const style = getComputedStyle(shell)
  const tokens = chapterTrack ? CHAPTER_COLUMN_TOKENS : hasChapters ? CHAPTER_LABEL_COLUMN_TOKENS : BOOK_COLUMN_TOKENS
  const columnHeightsPx = tokens.map((token) => cssLengthPx(style, token))
  return landscapeDensityFlags(fittingLandscapeDensityLevel(columnHeightsPx, cssLengthPx(style, '--fs-col-budget')))
}
