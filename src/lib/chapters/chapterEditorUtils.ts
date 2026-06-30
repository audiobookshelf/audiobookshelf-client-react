import type { AudioFile, AudibleChapterSearchResult, AudibleSearchChapter, Chapter } from '@/types/api'

export interface EditableChapter extends Chapter {
  error?: string | null
  clientKey?: string
}

export function createChapterClientKey(): string {
  return `ch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ensureClientKeys(chapters: EditableChapter[]): EditableChapter[] {
  if (chapters.every((chapter) => chapter.clientKey)) {
    return chapters
  }
  return chapters.map((chapter) => (chapter.clientKey ? chapter : { ...chapter, clientKey: createChapterClientKey() }))
}

export function computeHasChanges(chapters: EditableChapter[], existingChapters: Chapter[]): boolean {
  if (isEmptyListPlaceholderState(chapters, existingChapters)) {
    return false
  }
  if (chapters.length !== existingChapters.length) {
    return true
  }
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    const existingChapter = existingChapters[i]
    if (!existingChapter) {
      return true
    }
    if (
      chapter.start !== existingChapter.start ||
      chapter.end !== existingChapter.end ||
      (chapter.title || '').trim() !== (existingChapter.title || '').trim()
    ) {
      return true
    }
  }
  return false
}

export interface ChapterValidationMessages {
  firstNotZero: string
  startLtPrev: string
  startGteDuration: string
}

export interface BulkChapterPattern {
  before: string
  after: string
  startingNumber: number
  originalPadding: number
  hasLeadingZeros: boolean
}

export function initChapters(existing: Chapter[], mediaDuration: number): EditableChapter[] {
  const chapters = existing.map((c) => ({ ...c, error: null as string | null }))
  if (chapters.length === 0) {
    return ensureClientKeys([
      {
        id: 0,
        start: 0,
        end: mediaDuration,
        title: '',
        error: null
      }
    ])
  }
  return ensureClientKeys(chapters)
}

/** True when the editor shows the default single-row placeholder for an item with no saved chapters. */
export function isEmptyListPlaceholderState(chapters: EditableChapter[], existingChapters: Chapter[]): boolean {
  if (existingChapters.length > 0 || chapters.length !== 1) {
    return false
  }
  const chapter = chapters[0]
  return chapter.start === 0 && !(chapter.title || '').trim()
}

export function validateChapters(
  chapters: EditableChapter[],
  existingChapters: Chapter[],
  mediaDuration: number,
  messages: ChapterValidationMessages
): { chapters: EditableChapter[]; hasChanges: boolean } {
  let previousStart = 0
  const updated = chapters.map((chapter, i) => {
    const start = Number(chapter.start)

    let error: string | null
    if (i === 0 && start !== 0) {
      error = messages.firstNotZero
    } else if (start <= previousStart && i > 0) {
      error = messages.startLtPrev
    } else if (start >= mediaDuration) {
      error = messages.startGteDuration
    } else {
      error = null
    }
    previousStart = start

    if (chapter.id === i && chapter.error === error && chapter.start === start) {
      return chapter
    }
    return { ...chapter, id: i, start, error }
  })

  return { chapters: ensureClientKeys(updated), hasChanges: computeHasChanges(updated, existingChapters) }
}

export function computeChapterEnds(chapters: EditableChapter[], mediaDuration: number): Chapter[] {
  return chapters.map((chapter, i) => {
    const nextChapter = chapters[i + 1]
    return {
      id: chapter.id,
      start: chapter.start,
      end: nextChapter ? nextChapter.start : mediaDuration,
      title: (chapter.title || '').trim()
    }
  })
}

export function setChaptersFromTracks(tracks: AudioFile[]): EditableChapter[] {
  let currentStartTime = 0
  let index = 0
  const chapters: EditableChapter[] = []

  for (const track of tracks) {
    const filename = track.metadata?.filename ?? ''
    const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : ''
    const title = ext ? filename.slice(0, -ext.length) : filename

    chapters.push({
      id: index++,
      title,
      start: currentStartTime,
      end: currentStartTime + track.duration,
      error: null
    })
    currentStartTime += track.duration
  }

  return ensureClientKeys(chapters)
}

export function shiftChapterTimes(
  chapters: EditableChapter[],
  amount: number,
  lockedIds: Set<number>,
  mediaDuration: number
): EditableChapter[] {
  if (!amount || isNaN(amount) || chapters.length <= 1) {
    return chapters
  }

  return chapters.map((chap, i) => {
    if (lockedIds.has(chap.id)) {
      return chap
    }
    const next = { ...chap }
    next.end = Math.min(next.end + amount, mediaDuration)
    if (i > 0) {
      next.start = Math.max(0, next.start + amount)
    }
    return next
  })
}

export function mergeAudibleChapterTitles(
  chapters: EditableChapter[],
  audibleData: AudibleChapterSearchResult,
  lockedIds: Set<number>
): EditableChapter[] {
  return chapters.map((chapter, index) => {
    if (lockedIds.has(chapter.id) || !audibleData.chapters[index]) {
      return chapter
    }
    return { ...chapter, title: audibleData.chapters[index].title }
  })
}

export function mergeAudibleChapterData(
  chapters: EditableChapter[],
  audibleData: AudibleChapterSearchResult,
  lockedIds: Set<number>,
  mediaDuration: number
): EditableChapter[] {
  let index = 0
  const audibleChapters: EditableChapter[] = audibleData.chapters
    .filter((chap) => chap.startOffsetSec < mediaDuration)
    .map((chap) => ({
      id: index++,
      start: chap.startOffsetMs / 1000,
      end: Math.min(mediaDuration, (chap.startOffsetMs + chap.lengthMs) / 1000),
      title: chap.title,
      error: null,
      clientKey: createChapterClientKey()
    }))

  const merged: EditableChapter[] = []
  let audibleIdx = 0
  for (let i = 0; i < Math.max(chapters.length, audibleChapters.length); i++) {
    const isLocked = lockedIds.has(i)
    if (isLocked && chapters[i]) {
      merged.push({ ...chapters[i], id: i })
    } else if (audibleChapters[audibleIdx]) {
      merged.push({ ...audibleChapters[audibleIdx], id: i })
      audibleIdx++
    } else if (chapters[i]) {
      merged.push({ ...chapters[i], id: i })
    }
  }
  return merged
}

export function removeBrandingFromAudibleData(data: AudibleChapterSearchResult): AudibleChapterSearchResult {
  if (!data) return data
  try {
    const introDuration = data.brandIntroDurationMs ?? 0
    const outroDuration = data.brandOutroDurationMs ?? 0
    const chapters = data.chapters.map((chapter, i) => {
      const next = { ...chapter }
      if (next.startOffsetMs < introDuration) {
        next.startOffsetMs = i * 1000
        next.startOffsetSec = i
      } else {
        next.startOffsetMs -= introDuration
        next.startOffsetSec = Math.floor(next.startOffsetMs / 1000)
      }
      return next
    })

    const lastChapter = chapters[chapters.length - 1]
    const trimmedChapters =
      lastChapter && lastChapter.lengthMs <= outroDuration ? chapters.slice(0, -1) : chapters

    return {
      ...data,
      chapters: trimmedChapters,
      runtimeLengthMs: data.runtimeLengthMs - introDuration - outroDuration,
      runtimeLengthSec: Math.floor((data.runtimeLengthMs - introDuration - outroDuration) / 1000)
    }
  } catch {
    return data
  }
}

export function detectBulkChapterPattern(input: string): BulkChapterPattern | null {
  const numberMatch = input.match(/(\d+)/)
  if (!numberMatch || numberMatch.index === undefined) {
    return null
  }

  const originalNumberString = numberMatch[1]
  const foundNumber = parseInt(originalNumberString, 10)
  const numberIndex = numberMatch.index
  const beforeNumber = input.substring(0, numberIndex)
  const afterNumber = input.substring(numberIndex + originalNumberString.length)

  return {
    before: beforeNumber,
    after: afterNumber,
    startingNumber: foundNumber,
    originalPadding: originalNumberString.length,
    hasLeadingZeros: originalNumberString.length > 1 && originalNumberString.startsWith('0')
  }
}

export function formatNumberWithPadding(number: number, pattern: BulkChapterPattern): string {
  if (!pattern.hasLeadingZeros || pattern.originalPadding <= 1) {
    return number.toString()
  }
  return number.toString().padStart(pattern.originalPadding, '0')
}

export function buildBulkChapters(
  pattern: BulkChapterPattern,
  count: number,
  existingChapters: EditableChapter[],
  mediaDuration: number
): EditableChapter[] {
  const { before, after, startingNumber, hasLeadingZeros, originalPadding } = pattern
  const lastChapter = existingChapters[existingChapters.length - 1]
  const baseStart = lastChapter ? lastChapter.start + 1 : 0
  const newChapters: EditableChapter[] = []

  for (let i = 0; i < count; i++) {
    const chapterNumber = startingNumber + i
    let formattedNumber = chapterNumber.toString()
    if (hasLeadingZeros && originalPadding > 1) {
      formattedNumber = chapterNumber.toString().padStart(originalPadding, '0')
    }

    const newStart = baseStart + i
    const newEnd = Math.min(newStart + i + i, mediaDuration)

    newChapters.push({
      id: existingChapters.length + i,
      start: newStart,
      end: newEnd,
      title: `${before}${formattedNumber}${after}`,
      error: null
    })
  }

  return newChapters
}

export function addSingleChapterFromInput(
  title: string,
  existingChapters: EditableChapter[],
  mediaDuration: number
): EditableChapter[] {
  const lastChapter = existingChapters[existingChapters.length - 1]
  const newStart = lastChapter ? lastChapter.end : 0
  const newEnd = Math.min(newStart + 300, mediaDuration)

  return [
    ...existingChapters,
    {
      id: existingChapters.length,
      start: newStart,
      end: newEnd,
      title,
      error: null
    }
  ]
}

export function updateChapterStart(chapters: EditableChapter[], id: number, start: number): EditableChapter[] {
  return chapters.map((c) => (c.id === id ? { ...c, start } : c))
}

export function updateChapterTitle(chapters: EditableChapter[], id: number, title: string): EditableChapter[] {
  return chapters.map((c) => (c.id === id ? { ...c, title } : c))
}

export function applyChapterTitleDrafts(chapters: EditableChapter[], drafts: ReadonlyMap<number, string>): EditableChapter[] {
  if (drafts.size === 0) {
    return chapters
  }

  let changed = false
  const updated = chapters.map((chapter) => {
    const draft = drafts.get(chapter.id)
    if (draft === undefined) {
      return chapter
    }
    const trimmedTitle = draft.trim()
    if (trimmedTitle === chapter.title) {
      return chapter
    }
    changed = true
    return { ...chapter, title: trimmedTitle }
  })

  return changed ? updated : chapters
}

export function incrementChapterTime(
  chapters: EditableChapter[],
  id: number,
  amount: number,
  mediaDuration: number
): EditableChapter[] | null {
  const chapter = chapters.find((c) => c.id === id)
  if (!chapter) return null
  if (chapter.id === 0 && chapter.start + amount < 0) return null
  if (chapter.start + amount >= mediaDuration) return null
  return chapters.map((c) => (c.id === id ? { ...c, start: Math.max(0, c.start + amount) } : c))
}

export function removeChapterAt(chapters: EditableChapter[], id: number): EditableChapter[] {
  return chapters.filter((c) => c.id !== id)
}

export function insertChapterBelow(chapters: EditableChapter[], chapter: EditableChapter): EditableChapter[] {
  const insert: EditableChapter = {
    id: chapter.id + 1,
    start: chapter.start,
    end: chapter.end,
    title: '',
    error: null
  }
  const updated = [...chapters]
  updated.splice(chapter.id + 1, 0, insert)
  return updated
}

export function adjustChapterStartTime(chapters: EditableChapter[], id: number, elapsedTime: number): EditableChapter[] {
  return chapters.map((c) => (c.id === id ? { ...c, start: c.start + elapsedTime } : c))
}

export function getAudioTrackForTime<T extends { startOffset: number; duration: number }>(tracks: T[], time: number): T | null {
  if (typeof time !== 'number') {
    return null
  }
  return tracks.find((at) => time >= at.startOffset && time < at.startOffset + at.duration) ?? null
}

export function audibleChapterRowClass(
  chapter: AudibleSearchChapter,
  index: number,
  mediaDuration: number
): string {
  if (chapter.startOffsetSec > mediaDuration) {
    return 'bg-error/20'
  }
  if (chapter.startOffsetSec + chapter.lengthMs / 1000 > mediaDuration) {
    return 'bg-warning/20'
  }
  return index % 2 === 0 ? 'bg-primary/30' : ''
}
