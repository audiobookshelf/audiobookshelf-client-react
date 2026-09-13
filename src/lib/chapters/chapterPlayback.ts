import type { Chapter } from '@/types/api'

/** The chapter at a playback position and its neighbours, for prev/next navigation. */
export interface ChapterNavigation {
  current: Chapter | null
  next: Chapter | null
  previous: Chapter | null
}

export function findChapterNavigationAtTime(chapters: Chapter[], time: number): ChapterNavigation {
  return {
    current: chapters.find((chapter) => chapter.start <= time && chapter.end > time) ?? null,
    next: chapters.find((chapter) => chapter.start > time && chapter.end > time) ?? null,
    previous: chapters.findLast((chapter) => chapter.end <= time && chapter.start < time) ?? null
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
  if (!previous) return 0
  const currentStart = current?.start ?? 0
  return time - currentStart <= 3 ? previous.start : currentStart
}

/** Null when there is no next chapter, so the caller can fall back to the queue. */
export function resolveNextTarget(chapters: Chapter[], time: number): number | null {
  return findChapterNavigationAtTime(chapters, time).next?.start ?? null
}
