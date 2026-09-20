import type { Chapter } from '@/types/api'

export interface ChapterMarker {
  id: number
  start: number
  title: string
  /** `chapter.start / totalDuration` in the range (0, 1). */
  ratio: number
}

export interface ChapterSegment {
  id: number
  /** 1-based index in chronological order of valid chapters. */
  number: number
  start: number
  end: number
  title: string
  startRatio: number
  endRatio: number
  widthRatio: number
  /** Boundary dot inside the track; omitted for a chapter that starts at 00:00. */
  showBoundary: boolean
}

function isValidChapterStart(start: number, duration: number): boolean {
  return Number.isFinite(start) && start >= 0 && start < duration
}

/** Sorted valid chapters, including a chapter that starts at 00:00. */
export function getValidChapters(chapters: Chapter[] | null | undefined, duration: number): Chapter[] {
  if (!Array.isArray(chapters) || !Number.isFinite(duration) || duration <= 0) {
    return []
  }

  return chapters
    .filter((chapter) => isValidChapterStart(chapter?.start, duration))
    .map((chapter) => ({
      ...chapter,
      title: chapter.title ?? '',
      start: chapter.start
    }))
    .sort((a, b) => a.start - b.start || a.id - b.id)
}

/**
 * Chapter-start boundary markers for the player progress bar.
 * Skips the 00:00 chapter, non-finite/negative starts, and times at or beyond duration.
 */
export function getChapterMarkers(chapters: Chapter[] | null | undefined, duration: number): ChapterMarker[] {
  return getChapterSegments(chapters, duration)
    .filter((segment) => segment.showBoundary)
    .map((segment) => ({
      id: segment.id,
      start: segment.start,
      title: segment.title,
      ratio: segment.startRatio
    }))
}

/** Selectable ranges from each valid chapter start to the next start (last range ends at duration). */
export function getChapterSegments(chapters: Chapter[] | null | undefined, duration: number): ChapterSegment[] {
  const valid = getValidChapters(chapters, duration)
  if (!valid.length) return []

  const segments: ChapterSegment[] = []

  for (let index = 0; index < valid.length; index++) {
    const chapter = valid[index]
    const start = chapter.start
    const end = index < valid.length - 1 ? valid[index + 1].start : duration
    if (!Number.isFinite(end) || end <= start) continue

    segments.push({
      id: chapter.id,
      number: segments.length + 1,
      start,
      end,
      title: chapter.title ?? '',
      startRatio: start / duration,
      endRatio: end / duration,
      widthRatio: (end - start) / duration,
      showBoundary: start > 0
    })
  }

  return segments
}

export function formatChapterSegmentLabel(number: number, title: string, heading = `Chapter ${number}`): string {
  const trimmed = title.trim()
  return trimmed ? `${heading} - ${trimmed}` : heading
}

export function isActiveChapterSegment(segment: ChapterSegment, currentTime: number, isLast: boolean): boolean {
  if (isLast) return currentTime >= segment.start
  return currentTime >= segment.start && currentTime < segment.end
}
