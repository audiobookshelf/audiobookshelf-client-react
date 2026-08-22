import type { AudioFile, AudibleChapterSearchResult, Chapter } from '@/types/api'
import {
  buildChapterMatchDebugByIncomingIndex,
  matchChaptersMonotonic,
  toChapterMatchInput,
  type ChapterMatchDebug,
  type ChapterMatchResult
} from '@/lib/chapters/chapterMatching'

export type { ChapterMatchDebug } from '@/lib/chapters/chapterMatching'

export interface ChapterMergeWithMatchResult {
  chapters: EditableChapter[]
  matchDebug: Map<number, ChapterMatchDebug>
}

export interface EditableChapter extends Chapter {
  error?: string | null
  clientKey?: string
}

export function createChapterClientKey(): string {
  return `ch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createStableChapterClientKey(index: number): string {
  return `ch-${index}`
}

function getStableChapterSavedIndex(clientKey: string): number | null {
  const match = /^ch-(\d+)$/.exec(clientKey)
  if (!match) return null
  return Number(match[1])
}

export function ensureClientKeys(chapters: EditableChapter[]): EditableChapter[] {
  if (chapters.every((chapter) => chapter.clientKey)) {
    return chapters
  }
  return chapters.map((chapter) => (chapter.clientKey ? chapter : { ...chapter, clientKey: createChapterClientKey() }))
}

export function computeHasChanges(chapters: EditableChapter[], existingChapters: Chapter[], mediaDuration: number): boolean {
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
    const chapterEnd = chapters[i + 1] ? chapters[i + 1].start : mediaDuration
    const existingEnd = existingChapters[i + 1] ? existingChapters[i + 1].start : mediaDuration
    if (
      !chapterTimesEqual(chapter.start, existingChapter.start) ||
      !chapterTimesEqual(chapterEnd, existingEnd) ||
      (chapter.title || '').trim() !== (existingChapter.title || '').trim()
    ) {
      return true
    }
  }
  return false
}

/** Whole seconds for editor display; matches DurationPicker rounding. */
export function normalizeChapterStartSec(start: number): number {
  if (start == null || Number.isNaN(start)) {
    return 0
  }
  return Math.round(start)
}

/** Audible/API timestamps are ms; Vue uses floor when converting to seconds. */
export function audibleMsToChapterStartSec(ms: number): number {
  if (ms == null || Number.isNaN(ms)) {
    return 0
  }
  return Math.floor(ms / 1000)
}

/** Starts within this many seconds compare equal (Audible ms rounding vs saved whole seconds). */
const CHAPTER_START_TOLERANCE_SEC = 1

/** DurationPicker and timestamps are whole seconds; ignore sub-second and ±1s Audible drift. */
function chapterTimesEqual(a: number, b: number): boolean {
  return Math.abs(normalizeChapterStartSec(a) - normalizeChapterStartSec(b)) <= CHAPTER_START_TOLERANCE_SEC
}

export interface ChapterDirtySnapshot {
  start: number
  title: string
  end: number
}

export interface ChapterDirtyFields {
  start: boolean
  title: boolean
  duration: boolean
}

export function buildChapterDirtyBaseline(
  editorChapters: EditableChapter[],
  savedChapters: Chapter[],
  mediaDuration: number
): Map<string, ChapterDirtySnapshot> {
  const baseline = new Map<string, ChapterDirtySnapshot>()

  if (savedChapters.length === 0 && isSingleEmptyPlaceholderRow(editorChapters)) {
    const chapter = editorChapters[0]
    if (chapter?.clientKey) {
      baseline.set(chapter.clientKey, { start: 0, title: '', end: mediaDuration })
    }
    return baseline
  }

  for (const chapter of editorChapters) {
    if (!chapter.clientKey) continue
    const savedIndex = getStableChapterSavedIndex(chapter.clientKey)
    if (savedIndex === null || savedIndex >= savedChapters.length) continue

    const saved = savedChapters[savedIndex]
    const nextSaved = savedChapters[savedIndex + 1]
    baseline.set(chapter.clientKey, {
      start: saved.start,
      title: (saved.title || '').trim(),
      end: nextSaved ? nextSaved.start : mediaDuration
    })
  }
  return baseline
}

export function getChapterDirtyFields(chapter: EditableChapter, baseline: Map<string, ChapterDirtySnapshot>): ChapterDirtyFields {
  const snapshot = chapter.clientKey ? baseline.get(chapter.clientKey) : undefined
  if (!snapshot) {
    return { start: true, title: true, duration: true }
  }
  const startDirty = !chapterTimesEqual(chapter.start, snapshot.start)
  const titleDirty = (chapter.title || '').trim() !== snapshot.title
  return {
    start: startDirty,
    title: titleDirty,
    duration: startDirty || !chapterTimesEqual(chapter.end, snapshot.end)
  }
}

export interface ChapterValidationMessages {
  firstNotZero: string
  startLtPrev: string
  startGteDuration: string
}

export function initChapters(existing: Chapter[], mediaDuration: number): EditableChapter[] {
  if (existing.length === 0) {
    return [
      {
        id: 0,
        start: 0,
        end: mediaDuration,
        title: '',
        error: null,
        clientKey: createStableChapterClientKey(0)
      }
    ]
  }
  return existing.map((chapter, index) => ({
    ...chapter,
    error: null as string | null,
    clientKey: createStableChapterClientKey(index)
  }))
}

/** True when the editor shows a single empty row at start time 0 (no title). */
export function isSingleEmptyPlaceholderRow(chapters: EditableChapter[]): boolean {
  if (chapters.length !== 1) {
    return false
  }
  const chapter = chapters[0]
  return chapter.start === 0 && !(chapter.title || '').trim()
}

/** True when the editor shows the default single-row placeholder for an item with no saved chapters. */
export function isEmptyListPlaceholderState(chapters: EditableChapter[], existingChapters: Chapter[]): boolean {
  return existingChapters.length === 0 && isSingleEmptyPlaceholderRow(chapters)
}

/** True when all saved chapters were removed and the empty placeholder row is shown. */
export function isClearAllChaptersState(chapters: EditableChapter[], existingChapters: Chapter[]): boolean {
  return existingChapters.length > 0 && isSingleEmptyPlaceholderRow(chapters)
}

/** True when the list shows real chapters rather than only the empty placeholder row. */
export function hasNonPlaceholderChapters(chapters: EditableChapter[]): boolean {
  return chapters.length > 0 && !isSingleEmptyPlaceholderRow(chapters)
}

export function validateChapters(
  chapters: EditableChapter[],
  existingChapters: Chapter[],
  mediaDuration: number,
  messages: ChapterValidationMessages
): { chapters: EditableChapter[]; hasChanges: boolean } {
  let previousStart = 0
  const updated = chapters.map((chapter, i) => {
    const start = normalizeChapterStartSec(Number(chapter.start))

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

  return { chapters: ensureClientKeys(updated), hasChanges: computeHasChanges(updated, existingChapters, mediaDuration) }
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

/** Empty or omitted `idsToShift` shifts every chapter. Chapter 0 start stays at 0:00. */
export function shiftChapterTimes(
  chapters: EditableChapter[],
  amount: number,
  idsToShift: Set<number> | null | undefined,
  mediaDuration: number
): EditableChapter[] {
  if (!amount || isNaN(amount)) {
    return chapters
  }

  const selectedIds = idsToShift && idsToShift.size > 0 ? idsToShift : null

  return chapters.map((chap, i) => {
    if (selectedIds && !selectedIds.has(chap.id)) {
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

export function applyMatchedClientKeys(existing: EditableChapter[], incomingRows: EditableChapter[], matchResult: ChapterMatchResult): EditableChapter[] {
  return incomingRows.map((row, incomingIndex) => {
    const incomingStart = normalizeChapterStartSec(row.start)
    const existingIndex = matchResult.matches.get(incomingIndex)
    if (existingIndex === undefined) {
      return { ...row, start: incomingStart, clientKey: createChapterClientKey() }
    }
    const matched = existing[existingIndex]
    const clientKey = matched?.clientKey ?? createChapterClientKey()
    const start = matched && chapterTimesEqual(incomingStart, matched.start) ? matched.start : incomingStart
    return { ...row, clientKey, start }
  })
}

function buildAudibleIncomingChapters(audibleData: AudibleChapterSearchResult, mediaDuration: number): EditableChapter[] {
  let index = 0
  return audibleData.chapters
    .filter((chap) => audibleMsToChapterStartSec(chap.startOffsetMs) < mediaDuration)
    .map((chap) => ({
      id: index,
      start: audibleMsToChapterStartSec(chap.startOffsetMs),
      end: Math.min(mediaDuration, audibleMsToChapterStartSec(chap.startOffsetMs + chap.lengthMs)),
      title: chap.title,
      error: null as string | null
    }))
}

/**
 * Keep existing start times: result follows found (Audible) chapters.
 * - Matched: found title + existing start (and clientKey)
 * - Unmatched found: keep as-is (new clientKey)
 * - Unmatched existing: dropped
 */
export function mergeAudibleChapterTitles(
  chapters: EditableChapter[],
  audibleData: AudibleChapterSearchResult,
  mediaDuration: number
): ChapterMergeWithMatchResult {
  const incomingRows = buildAudibleIncomingChapters(audibleData, mediaDuration).map((chapter, index) => ({
    ...chapter,
    id: index
  }))

  if (chapters.length === 0) {
    const result = ensureClientKeys(
      incomingRows.map((chapter, index) => ({
        ...chapter,
        clientKey: createStableChapterClientKey(index)
      }))
    )
    return { chapters: result, matchDebug: new Map() }
  }

  const existingInputs = chapters.map(toChapterMatchInput)
  const incomingInputs = incomingRows.map(toChapterMatchInput)
  const matchResult = matchChaptersMonotonic(existingInputs, incomingInputs)

  const merged = incomingRows.map((row, incomingIndex) => {
    const existingIndex = matchResult.matches.get(incomingIndex)
    if (existingIndex === undefined) {
      return {
        ...row,
        start: normalizeChapterStartSec(row.start),
        clientKey: createChapterClientKey()
      }
    }

    const matched = chapters[existingIndex]
    return {
      ...row,
      start: matched?.start ?? normalizeChapterStartSec(row.start),
      clientKey: matched?.clientKey ?? createChapterClientKey()
    }
  })

  return {
    chapters: ensureClientKeys(merged),
    matchDebug: buildChapterMatchDebugByIncomingIndex(existingInputs, matchResult)
  }
}

/** Partial title mapping when baseline has real chapters. */
export function canMapAudibleChapterTitles(baselineChapterCount: number): boolean {
  return baselineChapterCount > 0
}

export function mergeAudibleChapterData(
  audibleData: AudibleChapterSearchResult,
  mediaDuration: number,
  existingChapters: EditableChapter[] = []
): ChapterMergeWithMatchResult {
  const incomingRows = buildAudibleIncomingChapters(audibleData, mediaDuration).map((chapter, index) => ({
    ...chapter,
    id: index
  }))

  if (existingChapters.length === 0) {
    const chapters = ensureClientKeys(
      incomingRows.map((chapter, index) => ({
        ...chapter,
        clientKey: createStableChapterClientKey(index)
      }))
    )
    return { chapters, matchDebug: new Map() }
  }

  const existingInputs = existingChapters.map(toChapterMatchInput)
  const incomingInputs = incomingRows.map(toChapterMatchInput)
  const matchResult = matchChaptersMonotonic(existingInputs, incomingInputs)
  const chapters = ensureClientKeys(applyMatchedClientKeys(existingChapters, incomingRows, matchResult))

  return {
    chapters,
    matchDebug: buildChapterMatchDebugByIncomingIndex(existingInputs, matchResult)
  }
}

export function removeBrandingFromAudibleData(data: AudibleChapterSearchResult): AudibleChapterSearchResult {
  if (!data) return data
  try {
    const introDuration = data.brandIntroDurationMs ?? 0
    const outroDuration = data.brandOutroDurationMs ?? 0
    const chapters = data.chapters.map((chapter, i) => {
      const next = { ...chapter }
      if (next.startOffsetMs < introDuration) {
        // Intro overlap on the first chapter(s); align to whole-second placeholders (Vue parity).
        next.startOffsetMs = i * 1000
        next.startOffsetSec = i
      } else {
        next.startOffsetMs -= introDuration
        next.startOffsetSec = audibleMsToChapterStartSec(next.startOffsetMs)
        next.startOffsetMs = next.startOffsetSec * 1000
      }
      return next
    })

    const lastChapter = chapters[chapters.length - 1]
    const trimmedChapters = lastChapter && lastChapter.lengthMs <= outroDuration ? chapters.slice(0, -1) : chapters

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

export function addSingleChapterFromInput(title: string, existingChapters: EditableChapter[], mediaDuration: number): EditableChapter[] {
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

export function setChaptersFromTracks(audioFiles: AudioFile[], existingChapters: EditableChapter[] = []): ChapterMergeWithMatchResult {
  let currentStartTime = 0
  let index = 0
  const incomingRows: EditableChapter[] = []

  for (const track of audioFiles) {
    if (track.exclude) continue
    const filename = track.metadata?.filename ?? ''
    const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : ''
    const title = ext ? filename.slice(0, -ext.length) : filename

    incomingRows.push({
      id: index,
      title,
      start: currentStartTime,
      end: currentStartTime + track.duration,
      error: null
    })
    currentStartTime += track.duration
    index++
  }

  if (existingChapters.length === 0) {
    const chapters = ensureClientKeys(
      incomingRows.map((chapter, rowIndex) => ({
        ...chapter,
        clientKey: createStableChapterClientKey(rowIndex)
      }))
    )
    return { chapters, matchDebug: new Map() }
  }

  const existingInputs = existingChapters.map(toChapterMatchInput)
  const incomingInputs = incomingRows.map(toChapterMatchInput)
  const matchResult = matchChaptersMonotonic(existingInputs, incomingInputs)
  const chapters = ensureClientKeys(applyMatchedClientKeys(existingChapters, incomingRows, matchResult))

  return {
    chapters,
    matchDebug: buildChapterMatchDebugByIncomingIndex(existingInputs, matchResult)
  }
}

export function getAudioTrackForTime<T extends { startOffset: number; duration: number }>(tracks: T[], time: number): T | null {
  if (typeof time !== 'number') {
    return null
  }
  return tracks.find((at) => time >= at.startOffset && time < at.startOffset + at.duration) ?? null
}

export type AudibleChapterOverflow = 'start' | 'end' | null

export function getChapterTimeOverflow(start: number, end: number, mediaDuration: number): AudibleChapterOverflow {
  if (start > mediaDuration) return 'start'
  if (end > mediaDuration) return 'end'
  return null
}
