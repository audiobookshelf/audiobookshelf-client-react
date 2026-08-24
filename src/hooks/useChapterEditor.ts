'use client'

import { updateChaptersAction } from '@/app/actions/chapterActions'
import { getExpandedLibraryItemAction } from '@/app/actions/mediaActions'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useChapterPreviewAudio } from '@/hooks/useChapterPreviewAudio'
import { useItemPageSocket } from '@/hooks/useItemPageSocket'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import {
  applyChapterTitleDrafts,
  buildBulkChapters,
  buildChapterDirtyBaseline,
  buildIdenticalChapters,
  clampBulkChapterCount,
  computeChapterEnds,
  computeHasChanges,
  canMapAudibleChapterTitles,
  detectBulkChapterPattern,
  hasNonPlaceholderChapters,
  initChapters,
  insertChapterBelow,
  isClearAllChaptersState,
  mergeAudibleChapterData,
  mergeAudibleChapterTitles,
  removeBrandingFromAudibleData,
  removeChapterAt,
  savedChapterListsMatch,
  setChaptersFromTracks,
  shiftChapterTimes,
  updateChapterStart,
  updateChapterTitle,
  validateChapters,
  type EditableChapter,
  type ChapterMatchDebug
} from '@/lib/chapters/chapterEditorUtils'
import { SHOW_CHAPTER_MATCH_DEBUG } from '@/lib/chapters/chapterMatching'
import { blurActiveChapterEditorField } from '@/lib/chapterEditorFocus'
import type { AudibleChapterSearchResult, BookLibraryItem, Chapter, PodcastLibraryItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'

interface UseChapterEditorOptions {
  initialLibraryItem: BookLibraryItem
  onItemUpdated?: (item: BookLibraryItem) => void
}

function selectedChapterIds(chapters: EditableChapter[], selectedKeys: Set<string>): Set<number> | null {
  if (selectedKeys.size === 0) return null
  const ids = new Set<number>()
  for (const chapter of chapters) {
    if (chapter.clientKey && selectedKeys.has(chapter.clientKey)) {
      ids.add(chapter.id)
    }
  }
  return ids
}

export function useChapterEditor({ initialLibraryItem, onItemUpdated }: UseChapterEditorOptions) {
  const [libraryItem, setLibraryItem] = useState(initialLibraryItem)

  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { token } = useUser()
  const [isPending, startTransition] = useTransition()

  const media = libraryItem.media
  const mediaDuration = media.duration ?? 0
  const mediaDurationRounded = Math.round(mediaDuration)
  const savedChapters = useMemo(() => media.chapters || [], [media.chapters])
  const tracks = useMemo(() => media.tracks ?? [], [media.tracks])

  const [newChapters, setNewChapters] = useState<EditableChapter[]>(() => initChapters(savedChapters, mediaDuration))
  const dirtyBaseline = useMemo(() => buildChapterDirtyBaseline(newChapters, savedChapters, mediaDuration), [mediaDuration, newChapters, savedChapters])
  const [hasChanges, setHasChanges] = useState(false)
  const hasChangesRef = useRef(hasChanges)
  hasChangesRef.current = hasChanges
  const [lookupResult, setLookupResult] = useState<AudibleChapterSearchResult | null>(null)
  const [lookupBaselineCount, setLookupBaselineCount] = useState(0)
  const [shiftAmount, setShiftAmount] = useState(0)
  const [addChapterInput, setAddChapterInput] = useState('')
  const [bulkChapterCount, setBulkChapterCountState] = useState(1)
  const [removeBranding, setRemoveBranding] = useState(false)
  const [mapChapterTitles, setMapChapterTitles] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const [chapterMatchDebug, setChapterMatchDebug] = useState<Map<number, ChapterMatchDebug>>(() => new Map())
  const [chapterMatchDebugActive, setChapterMatchDebugActive] = useState(false)
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const titleDraftsRef = useRef<Map<number, string>>(new Map())
  const shiftBaseChaptersRef = useRef<EditableChapter[]>(initChapters(savedChapters, mediaDuration).map((chapter) => ({ ...chapter })))

  /** Saved chapters as editable rows — always the identity baseline for matching (not current editor). */
  const matchBaselineChapters = useMemo(() => initChapters(savedChapters, mediaDuration), [mediaDuration, savedChapters])

  const cloneMatchBaseline = useCallback(() => matchBaselineChapters.map((chapter) => ({ ...chapter })), [matchBaselineChapters])

  const clearTitleDrafts = useCallback(() => {
    titleDraftsRef.current.clear()
  }, [])

  const preview = useChapterPreviewAudio({ tracks, token })

  const clearChapterMatchDebug = useCallback(() => {
    setChapterMatchDebug(new Map())
    setChapterMatchDebugActive(false)
  }, [])

  const clearLookupUi = useCallback(() => {
    setLookupResult(null)
    setLookupBaselineCount(0)
    setMapChapterTitles(false)
    setRemoveBranding(false)
    clearChapterMatchDebug()
  }, [clearChapterMatchDebug])

  const validationMessages = useMemo(
    () => ({
      firstNotZero: t('MessageChapterErrorFirstNotZero'),
      startLtPrev: t('MessageChapterErrorStartLtPrev'),
      startGteDuration: t('MessageChapterErrorStartGteDuration')
    }),
    [t]
  )

  const lookupResultForPreview = useMemo(() => {
    if (!lookupResult) return null
    return removeBranding ? removeBrandingFromAudibleData(lookupResult) : lookupResult
  }, [lookupResult, removeBranding])

  const canMapChapterTitles = useMemo(() => {
    if (!lookupResultForPreview) return false
    return canMapAudibleChapterTitles(lookupBaselineCount)
  }, [lookupBaselineCount, lookupResultForPreview])

  const runValidation = useCallback(
    (chapters: EditableChapter[], existingOverride?: Chapter[]) => {
      const result = validateChapters(chapters, existingOverride ?? savedChapters, mediaDuration, validationMessages)
      setNewChapters(result.chapters)
      setHasChanges(result.hasChanges)
      shiftBaseChaptersRef.current = result.chapters.map((chapter) => ({ ...chapter }))
      setShiftAmount(0)
      return result.chapters
    },
    [mediaDuration, savedChapters, validationMessages]
  )

  const handleShiftAmountChange = useCallback((amount: number) => {
    setShiftAmount(amount)
  }, [])

  const handleApplyShift = useCallback(() => {
    blurActiveChapterEditorField()
    const amount = shiftAmount
    if (!amount || Number.isNaN(amount) || newChapters.length <= 1) return

    const base = shiftBaseChaptersRef.current
    runValidation(shiftChapterTimes(base, amount, selectedChapterIds(base, selectedKeys), mediaDuration))
  }, [mediaDuration, newChapters.length, runValidation, selectedKeys, shiftAmount])

  const replaceChapterList = useCallback(
    (chapters: EditableChapter[], existingOverride?: Chapter[]) => {
      clearTitleDrafts()
      return runValidation(chapters, existingOverride)
    },
    [clearTitleDrafts, runValidation]
  )

  const loadSavedChapters = useCallback(
    (saved: Chapter[], duration: number) => {
      preview.destroyAudioEl()
      clearLookupUi()
      setSelectedKeys(new Set())
      clearTitleDrafts()
      const chapters = initChapters(saved, duration)
      const result = validateChapters(chapters, saved, duration, validationMessages)
      setNewChapters(result.chapters)
      setHasChanges(result.hasChanges)
      shiftBaseChaptersRef.current = result.chapters.map((chapter) => ({ ...chapter }))
      setShiftAmount(0)
    },
    [clearLookupUi, clearTitleDrafts, preview, validationMessages]
  )

  const resetEditorChapters = useCallback(() => {
    loadSavedChapters(savedChapters, mediaDuration)
  }, [loadSavedChapters, mediaDuration, savedChapters])

  const refreshAfterChapterUpdate = useCallback(
    async (successToast: string) => {
      showToast(successToast, { type: 'success' })
      const refreshed = await getExpandedLibraryItemAction(libraryItem.id)
      if (refreshed.mediaType === 'book') {
        const book = refreshed as BookLibraryItem
        setLibraryItem(book)
        loadSavedChapters(book.media.chapters || [], book.media.duration ?? 0)
        onItemUpdated?.(book)
      }
    },
    [libraryItem.id, loadSavedChapters, onItemUpdated, showToast]
  )

  const handleSocketItemUpdated = useCallback(
    (updated: BookLibraryItem | PodcastLibraryItem) => {
      if (updated.id !== libraryItem.id || updated.mediaType !== 'book') return
      if (hasChangesRef.current) return

      const book = updated as BookLibraryItem
      const nextSaved = book.media.chapters || []
      const nextDuration = book.media.duration ?? 0
      const chaptersChanged = nextDuration !== mediaDuration || !savedChapterListsMatch(savedChapters, nextSaved)

      setLibraryItem(book)
      if (chaptersChanged) {
        loadSavedChapters(nextSaved, nextDuration)
      }
      onItemUpdated?.(book)
    },
    [libraryItem.id, loadSavedChapters, mediaDuration, onItemUpdated, savedChapters]
  )

  useItemPageSocket({
    libraryItemId: libraryItem.id,
    mediaId: media.id,
    isPodcast: false,
    onItemUpdated: handleSocketItemUpdated
  })

  const isSavingRef = useRef(false)

  const handleSave = useCallback(
    (onSaved?: () => void) => {
      if (isSavingRef.current) return false

      preview.destroyAudioEl()
      const withDrafts = applyChapterTitleDrafts(newChapters, titleDraftsRef.current)
      clearTitleDrafts()
      const validated = runValidation(withDrafts)
      const clearingAllChapters = isClearAllChaptersState(validated, savedChapters)

      if (!clearingAllChapters) {
        for (const chapter of validated) {
          if (chapter.error) {
            showToast(t('ToastChaptersHaveErrors'), { type: 'error' })
            return false
          }
          if (!(chapter.title || '').trim()) {
            showToast(t('ToastChaptersMustHaveTitles'), { type: 'error' })
            return false
          }
        }
      }

      const payload = clearingAllChapters ? [] : computeChapterEnds(validated, mediaDuration)

      const successToast = payload.length === 0 ? t('ToastChaptersRemoved') : t('ToastChaptersUpdated')

      isSavingRef.current = true
      startTransition(async () => {
        try {
          const data = await updateChaptersAction(libraryItem.id, payload)
          if (data.updated) {
            await refreshAfterChapterUpdate(successToast)
            onSaved?.()
          } else {
            showToast(t('MessageNoUpdatesWereNecessary'), { type: 'info' })
            clearLookupUi()
          }
        } catch (error) {
          console.error('Failed to update chapters', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
        } finally {
          isSavingRef.current = false
        }
      })
      return true
    },
    [
      clearLookupUi,
      clearTitleDrafts,
      libraryItem.id,
      mediaDuration,
      newChapters,
      preview,
      refreshAfterChapterUpdate,
      runValidation,
      savedChapters,
      showToast,
      t
    ]
  )

  const applyLookupMerge = useCallback(
    (data: AudibleChapterSearchResult, matchBaseline: EditableChapter[], nextMapTitles: boolean, nextRemoveBranding: boolean) => {
      const processed = nextRemoveBranding ? removeBrandingFromAudibleData(data) : data
      const baselineCount = hasNonPlaceholderChapters(matchBaseline) ? matchBaseline.length : 0
      const useMapTitles = nextMapTitles && canMapAudibleChapterTitles(baselineCount)
      setMapChapterTitles(useMapTitles)
      const mergeResult = useMapTitles
        ? mergeAudibleChapterTitles(matchBaseline, processed, mediaDuration)
        : mergeAudibleChapterData(processed, mediaDuration, matchBaseline)
      setChapterMatchDebug(mergeResult.matchDebug)
      setChapterMatchDebugActive(true)
      preview.destroyAudioEl()
      replaceChapterList(mergeResult.chapters.length ? mergeResult.chapters : initChapters([], mediaDuration))
    },
    [mediaDuration, preview, replaceChapterList]
  )

  const handleLookupResult = useCallback(
    (data: AudibleChapterSearchResult) => {
      blurActiveChapterEditorField()
      const matchBaseline = cloneMatchBaseline()
      setLookupResult(data)
      setLookupBaselineCount(hasNonPlaceholderChapters(matchBaseline) ? matchBaseline.length : 0)
      setMapChapterTitles(false)
      setRemoveBranding(false)
      setSelectedKeys(new Set())
      applyLookupMerge(data, matchBaseline, false, false)
    },
    [applyLookupMerge, cloneMatchBaseline]
  )

  const handleMapChapterTitlesChange = useCallback(
    (value: boolean) => {
      if (!lookupResult) {
        setMapChapterTitles(value)
        return
      }
      applyLookupMerge(lookupResult, cloneMatchBaseline(), value, removeBranding)
    },
    [applyLookupMerge, cloneMatchBaseline, lookupResult, removeBranding]
  )

  const handleRemoveBrandingChange = useCallback(
    (value: boolean) => {
      if (!lookupResult) {
        setRemoveBranding(value)
        return
      }
      setRemoveBranding(value)
      applyLookupMerge(lookupResult, cloneMatchBaseline(), mapChapterTitles, value)
    },
    [applyLookupMerge, cloneMatchBaseline, lookupResult, mapChapterTitles]
  )

  const handleChapterCheckedChange = useCallback(
    (clientKey: string, checked: boolean) => {
      const next = new Set(selectedKeys)
      if (checked) next.add(clientKey)
      else next.delete(clientKey)
      setSelectedKeys(next)
    },
    [selectedKeys]
  )

  const handleToggleAllChaptersSelected = useCallback(
    (checked: boolean) => {
      const next = checked ? new Set(newChapters.map((chapter) => chapter.clientKey).filter((key): key is string => !!key)) : new Set<string>()
      setSelectedKeys(next)
    },
    [newChapters]
  )

  const handleRemoveSelected = useCallback(() => {
    if (selectedKeys.size === 0) return
    preview.destroyAudioEl()
    const remaining = newChapters.filter((chapter) => !chapter.clientKey || !selectedKeys.has(chapter.clientKey))
    replaceChapterList(remaining.length ? remaining : initChapters([], mediaDuration))
    setSelectedKeys(new Set())
  }, [mediaDuration, newChapters, preview, replaceChapterList, selectedKeys])

  const handleSetChaptersFromTracks = useCallback(() => {
    blurActiveChapterEditorField()
    preview.destroyAudioEl()
    clearLookupUi()
    setSelectedKeys(new Set())
    const mergeResult = setChaptersFromTracks(tracks, cloneMatchBaseline())
    setChapterMatchDebug(mergeResult.matchDebug)
    setChapterMatchDebugActive(true)
    replaceChapterList(mergeResult.chapters.length ? mergeResult.chapters : initChapters([], mediaDuration))
  }, [clearLookupUi, cloneMatchBaseline, mediaDuration, preview, replaceChapterList, tracks])

  const setBulkChapterCount = useCallback((count: number) => {
    setBulkChapterCountState(clampBulkChapterCount(count))
  }, [])

  const handleAddChapterFromInput = useCallback(() => {
    const input = addChapterInput.trim()
    if (!input) return

    const count = clampBulkChapterCount(bulkChapterCount)
    const pattern = detectBulkChapterPattern(input)
    const nextChapters = pattern
      ? buildBulkChapters(pattern, count, newChapters, mediaDuration)
      : buildIdenticalChapters(input, count, newChapters, mediaDuration)

    replaceChapterList(nextChapters)
    setAddChapterInput('')
    setBulkChapterCountState(1)
  }, [addChapterInput, bulkChapterCount, mediaDuration, newChapters, replaceChapterList])

  const handleChapterStartChange = useCallback(
    (chapterId: number, start: number) => {
      runValidation(updateChapterStart(newChapters, chapterId, start))
    },
    [newChapters, runValidation]
  )

  const handleChapterTitleDraft = useCallback(
    (chapterId: number, chapterTitle: string) => {
      titleDraftsRef.current.set(chapterId, chapterTitle)
      setHasChanges(computeHasChanges(applyChapterTitleDrafts(newChapters, titleDraftsRef.current), savedChapters, mediaDuration))
    },
    [mediaDuration, newChapters, savedChapters]
  )

  const handleChapterTitleCommit = useCallback(
    (chapterId: number, chapterTitle: string) => {
      titleDraftsRef.current.delete(chapterId)
      const trimmedTitle = chapterTitle.trim()
      let nextChapters = newChapters
      setNewChapters((prev) => {
        const existing = prev[chapterId]
        nextChapters = !existing || existing.title === trimmedTitle ? prev : updateChapterTitle(prev, chapterId, trimmedTitle)
        return nextChapters
      })
      setHasChanges(computeHasChanges(nextChapters, savedChapters, mediaDuration))
      if (nextChapters !== newChapters) {
        shiftBaseChaptersRef.current = nextChapters.map((chapter) => ({ ...chapter }))
        setShiftAmount(0)
      }
    },
    [mediaDuration, newChapters, savedChapters]
  )

  const handleChapterRemove = useCallback(
    (chapterId: number) => {
      runValidation(removeChapterAt(newChapters, chapterId))
    },
    [newChapters, runValidation]
  )

  const handleChapterInsertBelow = useCallback(
    (chapter: EditableChapter) => {
      runValidation(insertChapterBelow(newChapters, chapter))
    },
    [newChapters, runValidation]
  )

  useEffect(() => {
    setSelectedKeys((prev) => {
      if (prev.size === 0) return prev
      const validKeys = new Set(newChapters.map((chapter) => chapter.clientKey).filter((key): key is string => !!key))
      let changed = false
      const next = new Set<string>()
      for (const key of prev) {
        if (validKeys.has(key)) next.add(key)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [newChapters])

  return {
    media,
    mediaDuration,
    mediaDurationRounded,
    tracks,
    newChapters,
    dirtyBaseline,
    hasChanges,
    lookupResult,
    lookupResultForPreview,
    lookupBaselineCount,
    canMapChapterTitles,
    shiftAmount,
    addChapterInput,
    bulkChapterCount,
    removeBranding,
    mapChapterTitles,
    selectedKeys,
    chapterMatchDebug,
    chapterMatchDebugActive,
    showChapterMatchDebug: SHOW_CHAPTER_MATCH_DEBUG,
    confirmState,
    isPending,
    preview,
    handleShiftAmountChange,
    handleApplyShift,
    handleLookupResult,
    setAddChapterInput,
    setBulkChapterCount,
    handleMapChapterTitlesChange,
    handleRemoveBrandingChange,
    handleChapterCheckedChange,
    handleToggleAllChaptersSelected,
    handleRemoveSelected,
    handleSetChaptersFromTracks,
    setConfirmState,
    handleSave,
    handleAddChapterFromInput,
    handleChapterStartChange,
    handleChapterTitleDraft,
    handleChapterTitleCommit,
    handleChapterRemove,
    handleChapterInsertBelow,
    resetEditorChapters
  }
}
