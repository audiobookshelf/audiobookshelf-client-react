export interface ChapterMatchInput {
  start: number
  title: string
}

export interface ChapterMatchOptions {
  maxStartDeltaSec: number
  maxCost: number
  startWeight: number
  titleWeight: number
}

export const DEFAULT_CHAPTER_MATCH_OPTIONS: ChapterMatchOptions = {
  maxStartDeltaSec: 60,
  /** Start time is the identity signal; titles are often unrelated (filename vs Audible). */
  maxCost: 1,
  startWeight: 0.85,
  titleWeight: 0.15
}

export interface ChapterMatchResult {
  /** incomingIndex → existingIndex */
  matches: Map<number, number>
  /** incomingIndex → match cost */
  costs: Map<number, number>
}

export interface ChapterMatchDebug {
  oldStart: number
  oldTitle: string
  matchCost: number
}

/** Flip to true to show matched-saved start/title (`was: …`) under chapter fields after lookup or Set from Tracks. */
export const SHOW_CHAPTER_MATCH_DEBUG = false

function normalizeTitle(title: string): string {
  return (title || '').trim().toLowerCase()
}

/** Case-insensitive Levenshtein distance for short chapter titles. */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const rows = a.length + 1
  const cols = b.length + 1
  let prev = new Array<number>(cols)
  let curr = new Array<number>(cols)

  for (let j = 0; j < cols; j++) {
    prev[j] = j
  }

  for (let i = 1; i < rows; i++) {
    curr[0] = i
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    const swap = prev
    prev = curr
    curr = swap
  }

  return prev[b.length]
}

export function computeChapterMatchCost(
  existing: ChapterMatchInput,
  incoming: ChapterMatchInput,
  options: ChapterMatchOptions = DEFAULT_CHAPTER_MATCH_OPTIONS
): number {
  const startDelta = Math.abs(existing.start - incoming.start)
  if (startDelta > options.maxStartDeltaSec) {
    return Infinity
  }

  const startScore = startDelta / options.maxStartDeltaSec
  const normA = normalizeTitle(existing.title)
  const normB = normalizeTitle(incoming.title)
  const maxLen = Math.max(normA.length, normB.length, 1)
  const titleScore = levenshteinDistance(normA, normB) / maxLen

  return options.startWeight * startScore + options.titleWeight * titleScore
}

export function toChapterMatchInput(chapter: { start: number; title: string }): ChapterMatchInput {
  return { start: Math.round(chapter.start), title: chapter.title || '' }
}

/**
 * Monotonic matching: each incoming row maps to at most one unused existing row in start order.
 * Scans every existing chapter within the start-time window (not a fixed lookahead).
 */
export function matchChaptersMonotonic(
  existing: ChapterMatchInput[],
  incoming: ChapterMatchInput[],
  options: ChapterMatchOptions = DEFAULT_CHAPTER_MATCH_OPTIONS
): ChapterMatchResult {
  const matches = new Map<number, number>()
  const costs = new Map<number, number>()
  const usedExisting = new Set<number>()

  let existingPointer = 0

  for (let incomingIndex = 0; incomingIndex < incoming.length; incomingIndex++) {
    const incomingChapter = incoming[incomingIndex]

    while (existingPointer < existing.length && existing[existingPointer].start < incomingChapter.start - options.maxStartDeltaSec) {
      existingPointer++
    }

    let bestExistingIndex = -1
    let bestCost = Infinity

    for (let candidate = existingPointer; candidate < existing.length; candidate++) {
      if (usedExisting.has(candidate)) continue

      const existingStart = existing[candidate].start
      if (existingStart > incomingChapter.start + options.maxStartDeltaSec) {
        break
      }

      const cost = computeChapterMatchCost(existing[candidate], incomingChapter, options)
      if (cost === Infinity) continue

      if (cost < bestCost) {
        bestCost = cost
        bestExistingIndex = candidate
      }
    }

    if (bestExistingIndex >= 0 && bestCost <= options.maxCost) {
      matches.set(incomingIndex, bestExistingIndex)
      costs.set(incomingIndex, bestCost)
      usedExisting.add(bestExistingIndex)
      existingPointer = bestExistingIndex + 1
    }
  }

  return { matches, costs }
}

/** Debug keyed by output row index when output follows incoming order (full replace). */
export function buildChapterMatchDebugByIncomingIndex(existing: ChapterMatchInput[], matchResult: ChapterMatchResult): Map<number, ChapterMatchDebug> {
  const debug = new Map<number, ChapterMatchDebug>()

  for (const [incomingIndex, existingIndex] of matchResult.matches) {
    const old = existing[existingIndex]
    if (!old) continue
    debug.set(incomingIndex, {
      oldStart: old.start,
      oldTitle: (old.title || '').trim(),
      matchCost: matchResult.costs.get(incomingIndex) ?? 0
    })
  }

  return debug
}

/** Debug keyed by output row index when output follows existing order (map titles). */
export function buildChapterMatchDebugByExistingIndex(existing: ChapterMatchInput[], matchResult: ChapterMatchResult): Map<number, ChapterMatchDebug> {
  const debug = new Map<number, ChapterMatchDebug>()

  for (const [incomingIndex, existingIndex] of matchResult.matches) {
    const old = existing[existingIndex]
    if (!old) continue
    debug.set(existingIndex, {
      oldStart: old.start,
      oldTitle: (old.title || '').trim(),
      matchCost: matchResult.costs.get(incomingIndex) ?? 0
    })
  }

  return debug
}
