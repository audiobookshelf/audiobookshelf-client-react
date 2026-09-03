import type { Chapter } from '@/types/api'

/**
 * Chapter bounds arrive at a finer precision than playback positions, so a raw comparison can
 * place a seek to a chapter start in the previous chapter. Normalize bounds once on the way in
 * and lookups only have to round the incoming time.
 */
function roundToChapterPrecision(seconds: number): number {
  return parseFloat(seconds.toFixed(6))
}

export function normalizeChapters(chapters: Chapter[] | undefined): Chapter[] {
  return (chapters ?? []).map((chapter) => ({
    ...chapter,
    start: roundToChapterPrecision(chapter.start ?? 0),
    end: roundToChapterPrecision(chapter.end ?? 0)
  }))
}

/** Expects normalized chapters. */
export function findChapterIndexAtTime(chapters: Chapter[], time: number): number {
  const roundedTime = roundToChapterPrecision(time)
  return chapters.findLastIndex((chapter) => chapter.start <= roundedTime && chapter.end > roundedTime)
}

export function findChapterAtTime(chapters: Chapter[], time: number): Chapter | null {
  return chapters[findChapterIndexAtTime(chapters, time)] ?? null
}

/** The chapter at a playback position and its neighbours, for prev/next navigation. */
export interface ChapterNavigation {
  current: Chapter | null
  next: Chapter | null
  previous: Chapter | null
}

export function findChapterNavigationAtTime(chapters: Chapter[], time: number): ChapterNavigation {
  const currentIndex = findChapterIndexAtTime(chapters, time)

  if (currentIndex >= 0) {
    return {
      current: chapters[currentIndex],
      next: chapters[currentIndex + 1] ?? null,
      previous: chapters[currentIndex - 1] ?? null
    }
  }

  const roundedTime = roundToChapterPrecision(time)
  return {
    current: null,
    next: chapters.find((chapter) => chapter.start > roundedTime) ?? null,
    previous: chapters.findLast((chapter) => chapter.end <= roundedTime) ?? null
  }
}

/**
 * Within the first few seconds of a chapter Previous goes back a chapter rather than restarting
 * it, so a quick second press keeps skipping backwards. Null falls back to the queue.
 */
export function resolvePreviousTarget(chapters: Chapter[], time: number): number | null {
  if (chapters.length === 0) {
    return time > 3 ? 0 : null
  }

  const { current, previous } = findChapterNavigationAtTime(chapters, time)
  if (current && time - current.start > 3) {
    return current.start
  }
  return previous?.start ?? 0
}

/** Null when there is no next chapter, so the caller can fall back to the queue. */
export function resolveNextTarget(chapters: Chapter[], time: number): number | null {
  return findChapterNavigationAtTime(chapters, time).next?.start ?? null
}
