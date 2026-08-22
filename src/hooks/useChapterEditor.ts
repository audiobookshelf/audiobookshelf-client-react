'use client'

import { searchChaptersAction, updateChaptersAction } from '@/app/actions/chapterActions'
import { getExpandedLibraryItemAction } from '@/app/actions/mediaActions'
import { useMediaContext } from '@/contexts/MediaContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useChapterPreviewAudio } from '@/hooks/useChapterPreviewAudio'
import { useItemPageSocket } from '@/hooks/useItemPageSocket'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import {
  getAudibleChapterLookupErrorMessage,
  getInitialAsinFromMetadata,
  getStoredAudibleRegion,
  isValidAsin,
  setStoredAudibleRegion,
  type AudibleRegion
} from '@/lib/chapters/audibleChapterLookupPrefs'
import {
  addSingleChapterFromInput,
  adjustChapterStartTime,
  applyChapterTitleDrafts,
  buildBulkChapters,
  buildChapterDirtyBaseline,
  chapterListsEqual,
  computeChapterEnds,
  computeHasChanges,
  detectBulkChapterPattern,
  hasNonPlaceholderChapters,
  incrementChapterTime,
  initChapters,
  insertChapterBelow,
  isClearAllChaptersState,
  mergeAudibleChapterData,
  mergeAudibleChapterTitles,
  removeBrandingFromAudibleData,
  removeChapterAt,
  setChaptersFromTracks,
  shiftChapterTimes,
  updateChapterStart,
  updateChapterTitle,
  validateChapters,
  type BulkChapterPattern,
  type ChapterDirtySnapshot,
  type EditableChapter
} from '@/lib/chapters/chapterEditorUtils'
import type { AudibleChapterSearchResult, BookLibraryItem, Chapter } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'

interface UseChapterEditorOptions {
  initialLibraryItem: BookLibraryItem
  onItemUpdated?: (item: BookLibraryItem) => void
}

export type ChaptersToolbarPanelId = 'setFromTracks' | 'lookup'

export function useChapterEditor({ initialLibraryItem, onItemUpdated }: UseChapterEditorOptions) {
  const [libraryItem, setLibraryItem] = useState(initialLibraryItem)

  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { token } = useUser()
  const { streamLibraryItem } = useMediaContext()
  const [isPending, startTransition] = useTransition()

  const media = libraryItem.media
  const mediaDuration = media.duration ?? 0
  const mediaDurationRounded = Math.round(mediaDuration)
  const savedChapters = useMemo(() => media.chapters || [], [media.chapters])
  const tracks = useMemo(() => media.tracks ?? [], [media.tracks])
  const title = media.metadata.title ?? ''

  const [{ chapters: initialChapters, baseline: initialDirtyBaseline }] = useState(() => {
    const chapters = initChapters(savedChapters, mediaDuration)
    return { chapters, baseline: buildChapterDirtyBaseline(chapters, mediaDuration) }
  })
  const [newChapters, setNewChapters] = useState<EditableChapter[]>(initialChapters)
  const [dirtyBaseline, setDirtyBaseline] = useState<Map<string, ChapterDirtySnapshot>>(initialDirtyBaseline)
  const [hasChanges, setHasChanges] = useState(false)
  const [lockedChapters, setLockedChapters] = useState<Set<number>>(() => new Set())
  const [lastSelectedLockIndex, setLastSelectedLockIndex] = useState<number | null>(null)
  const [showSecondInputs, setShowSecondInputs] = useState(false)
  const [activeToolbarPanel, setActiveToolbarPanel] = useState<ChaptersToolbarPanelId | null>(null)
  const [lookupResult, setLookupResult] = useState<AudibleChapterSearchResult | null>(null)
  const [isLookupPending, setIsLookupPending] = useState(false)
  const [lookupAsinError, setLookupAsinError] = useState<string | null>(null)
  const [shiftAmount, setShiftAmount] = useState(0)
  const [previewShiftAmount, setPreviewShiftAmount] = useState(0)
  const [bulkChapterInput, setBulkChapterInput] = useState('')
  const [removeBranding, setRemoveBranding] = useState(false)
  const [mapChapterTitles, setMapChapterTitles] = useState(false)
  const [showBulkPatternPanel, setShowBulkPatternPanel] = useState(false)
  const [showShiftTimes, setShowShiftTimes] = useState(false)
  const [detectedPattern, setDetectedPattern] = useState<BulkChapterPattern | null>(null)
  const [bulkChapterCount, setBulkChapterCount] = useState(1)
  const [isTableEditMode, setIsTableEditMode] = useState(false)
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const titleDraftsRef = useRef<Map<number, string>>(new Map())
  const shiftBaseChaptersRef = useRef<EditableChapter[] | null>(null)
  const lookupInFlightRef = useRef(0)
  const showShiftTimesRef = useRef(false)
  showShiftTimesRef.current = showShiftTimes

  const clearTitleDrafts = useCallback(() => {
    titleDraftsRef.current.clear()
  }, [])

  const preview = useChapterPreviewAudio({ tracks, token })

  const closeShiftTimesPanel = useCallback(() => {
    shiftBaseChaptersRef.current = null
    setShowShiftTimes(false)
    setShiftAmount(0)
  }, [])

  const clearLookupUi = useCallback(() => {
    lookupInFlightRef.current += 1
    setIsLookupPending(false)
    setLookupResult(null)
    setLookupAsinError(null)
    setMapChapterTitles(false)
    setRemoveBranding(false)
  }, [])

  const startAsinLookup = useCallback(
    (asin: string, region: AudibleRegion) => {
      const requestId = ++lookupInFlightRef.current
      setIsLookupPending(true)
      setLookupAsinError(null)
      setStoredAudibleRegion(region)

      void (async () => {
        try {
          const data = await searchChaptersAction(asin, region)
          if (requestId !== lookupInFlightRef.current) return

          const errorMessage = getAudibleChapterLookupErrorMessage(data, t)
          if (errorMessage) {
            setLookupAsinError(errorMessage)
            setLookupResult(null)
            setActiveToolbarPanel('lookup')
            return
          }

          setLookupResult(data)
          setActiveToolbarPanel('lookup')
        } catch (error) {
          console.error('Failed to get chapter data', error)
          if (requestId !== lookupInFlightRef.current) return
          showToast(t('ToastFailedToLoadData'), { type: 'error' })
          setActiveToolbarPanel('lookup')
        } finally {
          if (requestId === lookupInFlightRef.current) {
            setIsLookupPending(false)
          }
        }
      })()
    },
    [showToast, t]
  )

  const toggleToolbarPanel = useCallback(
    (panel: ChaptersToolbarPanelId) => {
      preview.destroyAudioEl()

      if (panel === 'lookup') {
        if (activeToolbarPanel === 'lookup' || isLookupPending) {
          clearLookupUi()
          setActiveToolbarPanel(null)
          return
        }

        clearLookupUi()
        const asin = getInitialAsinFromMetadata(media.metadata)
        if (!isValidAsin(asin)) {
          setActiveToolbarPanel('lookup')
          return
        }

        setActiveToolbarPanel(null)
        startAsinLookup(asin, getStoredAudibleRegion())
        return
      }

      clearLookupUi()
      setActiveToolbarPanel(activeToolbarPanel === panel ? null : panel)
    },
    [activeToolbarPanel, clearLookupUi, isLookupPending, media.metadata, preview, startAsinLookup]
  )

  const closeToolbarPanel = useCallback(() => {
    preview.destroyAudioEl()
    clearLookupUi()
    setActiveToolbarPanel(null)
  }, [clearLookupUi, preview])

  const handleLookupResult = useCallback((data: AudibleChapterSearchResult) => {
    setLookupAsinError(null)
    setLookupResult(data)
  }, [])

  const validationMessages = useMemo(
    () => ({
      firstNotZero: t('MessageChapterErrorFirstNotZero'),
      startLtPrev: t('MessageChapterErrorStartLtPrev'),
      startGteDuration: t('MessageChapterErrorStartGteDuration')
    }),
    [t]
  )

  const allChaptersLocked = newChapters.length > 0 && newChapters.every((chapter) => lockedChapters.has(chapter.id))

  const displayCurrentChapters = useMemo(() => (hasNonPlaceholderChapters(newChapters) ? newChapters : []), [newChapters])

  const lookupResultForPreview = useMemo(() => {
    if (!lookupResult) return null
    return removeBranding ? removeBrandingFromAudibleData(lookupResult) : lookupResult
  }, [lookupResult, removeBranding])

  const stagedChaptersBase = useMemo(() => {
    if (activeToolbarPanel === 'setFromTracks') {
      return setChaptersFromTracks(tracks)
    }
    if (activeToolbarPanel === 'lookup' && lookupResultForPreview) {
      return mapChapterTitles
        ? mergeAudibleChapterTitles(newChapters, lookupResultForPreview, lockedChapters)
        : mergeAudibleChapterData(newChapters, lookupResultForPreview, lockedChapters, mediaDuration)
    }
    return null
  }, [activeToolbarPanel, lockedChapters, lookupResultForPreview, mapChapterTitles, mediaDuration, newChapters, tracks])

  const stagedChapters = useMemo(() => {
    if (!stagedChaptersBase) return null
    return shiftChapterTimes(stagedChaptersBase, previewShiftAmount, lockedChapters, mediaDuration)
  }, [lockedChapters, mediaDuration, previewShiftAmount, stagedChaptersBase])

  const isTransformPreviewOpen = stagedChapters !== null

  useEffect(() => {
    setPreviewShiftAmount(0)
  }, [activeToolbarPanel, lookupResult])

  const canApplyStagedTransform = useMemo(() => {
    if (!stagedChapters) return false
    return !chapterListsEqual(displayCurrentChapters, stagedChapters)
  }, [displayCurrentChapters, stagedChapters])

  const runValidation = useCallback(
    (chapters: EditableChapter[], existingOverride?: Chapter[], options?: { fromShift?: boolean }) => {
      if (showShiftTimesRef.current && !options?.fromShift) {
        closeShiftTimesPanel()
      }
      const result = validateChapters(chapters, existingOverride ?? savedChapters, mediaDuration, validationMessages)
      setNewChapters(result.chapters)
      setHasChanges(result.hasChanges)
      return result.chapters
    },
    [closeShiftTimesPanel, mediaDuration, savedChapters, validationMessages]
  )

  const toggleShiftTimesPanel = useCallback(() => {
    preview.destroyAudioEl()
    if (showShiftTimes) {
      closeShiftTimesPanel()
      return
    }
    const withDrafts = applyChapterTitleDrafts(newChapters, titleDraftsRef.current)
    shiftBaseChaptersRef.current = withDrafts.map((chapter) => ({ ...chapter }))
    setShiftAmount(0)
    setShowBulkPatternPanel(false)
    setShowShiftTimes(true)
  }, [closeShiftTimesPanel, newChapters, preview, showShiftTimes])

  const handleShiftAmountChange = useCallback(
    (amount: number) => {
      setShiftAmount(amount)
      const base = shiftBaseChaptersRef.current
      if (!base) return
      runValidation(shiftChapterTimes(base, amount, lockedChapters, mediaDuration), undefined, { fromShift: true })
    },
    [lockedChapters, mediaDuration, runValidation]
  )

  const captureDirtyBaseline = useCallback((chapters: EditableChapter[], duration: number) => {
    setDirtyBaseline(buildChapterDirtyBaseline(chapters, duration))
  }, [])

  const replaceChapterList = useCallback(
    (chapters: EditableChapter[], existingOverride?: Chapter[]) => {
      clearTitleDrafts()
      return runValidation(chapters, existingOverride)
    },
    [clearTitleDrafts, runValidation]
  )

  const resetEditorChapters = useCallback(() => {
    preview.destroyAudioEl()
    setLockedChapters(new Set())
    clearLookupUi()
    setActiveToolbarPanel(null)
    const chapters = initChapters(savedChapters, mediaDuration)
    captureDirtyBaseline(chapters, mediaDuration)
    replaceChapterList(chapters)
  }, [captureDirtyBaseline, clearLookupUi, mediaDuration, preview, replaceChapterList, savedChapters])

  const resetEditorState = useCallback(() => {
    setLibraryItem(initialLibraryItem)
    setLockedChapters(new Set())
    setLastSelectedLockIndex(null)
    setShowSecondInputs(false)
    setActiveToolbarPanel(null)
    clearLookupUi()
    setShiftAmount(0)
    setPreviewShiftAmount(0)
    setBulkChapterInput('')
    setShowBulkPatternPanel(false)
    setShowShiftTimes(false)
    shiftBaseChaptersRef.current = null
    setDetectedPattern(null)
    setBulkChapterCount(1)
    setIsTableEditMode(false)
    clearTitleDrafts()
    const saved = initialLibraryItem.media.chapters || []
    const duration = initialLibraryItem.media.duration ?? 0
    const chapters = initChapters(saved, duration)
    captureDirtyBaseline(chapters, duration)
    replaceChapterList(chapters, saved)
    preview.destroyAudioEl()
  }, [captureDirtyBaseline, clearLookupUi, clearTitleDrafts, initialLibraryItem, preview, replaceChapterList])

  const refreshAfterChapterUpdate = useCallback(
    async (successToast: string) => {
      showToast(successToast, { type: 'success' })
      const refreshed = await getExpandedLibraryItemAction(libraryItem.id)
      if (refreshed.mediaType === 'book') {
        const book = refreshed as BookLibraryItem
        setLibraryItem(book)
        const saved = book.media.chapters || []
        const chapters = initChapters(saved, mediaDuration)
        captureDirtyBaseline(chapters, mediaDuration)
        replaceChapterList(chapters, saved)
        setLockedChapters(new Set())
        onItemUpdated?.(book)
      }
    },
    [captureDirtyBaseline, libraryItem.id, mediaDuration, onItemUpdated, replaceChapterList, showToast]
  )

  useItemPageSocket({
    libraryItemId: libraryItem.id,
    mediaId: media.id,
    isPodcast: false,
    onItemUpdated: (updated) => {
      if (updated.id !== libraryItem.id || updated.mediaType !== 'book') return
      setLibraryItem(updated as BookLibraryItem)
    }
  })

  const handleSave = useCallback(
    (onSaved?: () => void) => {
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

      startTransition(async () => {
        try {
          const data = await updateChaptersAction(libraryItem.id, payload)
          if (data.updated) {
            await refreshAfterChapterUpdate(successToast)
          } else {
            showToast(t('MessageNoUpdatesWereNecessary'), { type: 'info' })
          }
          onSaved?.()
        } catch (error) {
          console.error('Failed to update chapters', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
        }
      })
      return true
    },
    [clearTitleDrafts, libraryItem.id, mediaDuration, newChapters, refreshAfterChapterUpdate, runValidation, savedChapters, showToast, t]
  )

  const applyStagedTransform = useCallback(() => {
    if (!stagedChapters || !canApplyStagedTransform) return

    replaceChapterList(stagedChapters)
    if (activeToolbarPanel === 'setFromTracks') {
      setLockedChapters(new Set())
    }

    preview.destroyAudioEl()
    setLookupResult(null)
    setMapChapterTitles(false)
    setRemoveBranding(false)
    setActiveToolbarPanel(null)
  }, [activeToolbarPanel, canApplyStagedTransform, preview, replaceChapterList, stagedChapters])

  const handleRemoveAll = useCallback(() => {
    preview.destroyAudioEl()
    replaceChapterList(initChapters([], mediaDuration))
    setLockedChapters(new Set())
  }, [mediaDuration, preview, replaceChapterList])

  const toggleChapterLock = useCallback(
    (chapterId: number, shiftKey: boolean) => {
      setLockedChapters((prev) => {
        const next = new Set(prev)
        if (shiftKey && lastSelectedLockIndex !== null) {
          const startIndex = Math.min(lastSelectedLockIndex, chapterId)
          const endIndex = Math.max(lastSelectedLockIndex, chapterId)
          const shouldLock = !prev.has(chapterId)
          for (let i = startIndex; i <= endIndex; i++) {
            if (shouldLock) next.add(i)
            else next.delete(i)
          }
        } else if (next.has(chapterId)) {
          next.delete(chapterId)
        } else {
          next.add(chapterId)
        }
        return next
      })
      setLastSelectedLockIndex(chapterId)
    },
    [lastSelectedLockIndex]
  )

  const toggleAllChaptersLock = useCallback(() => {
    if (allChaptersLocked) {
      setLockedChapters(new Set())
    } else {
      setLockedChapters(new Set(newChapters.map((c) => c.id)))
    }
  }, [allChaptersLocked, newChapters])

  const handleBulkChapterAdd = useCallback(() => {
    const input = bulkChapterInput.trim()
    if (!input) return

    const pattern = detectBulkChapterPattern(input)
    if (pattern) {
      closeShiftTimesPanel()
      setDetectedPattern(pattern)
      setBulkChapterCount(1)
      setShowBulkPatternPanel(true)
    } else {
      replaceChapterList(addSingleChapterFromInput(input, newChapters, mediaDuration))
      setBulkChapterInput('')
    }
  }, [bulkChapterInput, closeShiftTimesPanel, mediaDuration, newChapters, replaceChapterList])

  const handleAddBulkChapters = useCallback(() => {
    if (!detectedPattern) return
    const count = parseInt(String(bulkChapterCount), 10)
    if (!count || count < 1 || count > 150) {
      showToast(t('ToastBulkChapterInvalidCount'), { type: 'error' })
      return
    }

    const merged = [...newChapters, ...buildBulkChapters(detectedPattern, count, newChapters, mediaDuration)]
    replaceChapterList(merged)
    setBulkChapterInput('')
    setShowBulkPatternPanel(false)
    setDetectedPattern(null)
  }, [bulkChapterCount, detectedPattern, mediaDuration, newChapters, replaceChapterList, showToast, t])

  const handleAdjustChapterStartTime = useCallback(
    (chapterId: number) => {
      const chapter = newChapters.find((c) => c.id === chapterId)
      if (!chapter) return
      runValidation(adjustChapterStartTime(newChapters, chapterId, preview.elapsedTime))
      showToast(t('ToastChapterStartTimeAdjusted', { 0: preview.elapsedTime }), { type: 'success' })
      preview.destroyAudioEl()
    },
    [newChapters, preview, runValidation, showToast, t]
  )

  const handleChapterStartChange = useCallback(
    (chapterId: number, start: number) => {
      runValidation(updateChapterStart(newChapters, chapterId, start))
    },
    [newChapters, runValidation]
  )

  const handleChapterTitleDraft = useCallback(
    (chapterId: number, chapterTitle: string) => {
      titleDraftsRef.current.set(chapterId, chapterTitle)
      setHasChanges(computeHasChanges(applyChapterTitleDrafts(newChapters, titleDraftsRef.current), savedChapters))
    },
    [newChapters, savedChapters]
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
      setHasChanges(computeHasChanges(nextChapters, savedChapters))
    },
    [newChapters, savedChapters]
  )

  const commitTitleDrafts = useCallback(() => {
    const withDrafts = applyChapterTitleDrafts(newChapters, titleDraftsRef.current)
    clearTitleDrafts()
    if (withDrafts === newChapters) return
    setNewChapters(withDrafts)
    setHasChanges(computeHasChanges(withDrafts, savedChapters))
  }, [clearTitleDrafts, newChapters, savedChapters])

  const toggleTableEditMode = useCallback(() => {
    if (isTableEditMode) {
      commitTitleDrafts()
    }
    setIsTableEditMode((current) => !current)
    closeToolbarPanel()
    closeShiftTimesPanel()
    setShowBulkPatternPanel(false)
  }, [closeShiftTimesPanel, closeToolbarPanel, commitTitleDrafts, isTableEditMode])

  const handleChapterIncrementTime = useCallback(
    (chapterId: number, amount: number) => {
      const updated = incrementChapterTime(newChapters, chapterId, amount, mediaDuration)
      if (updated) runValidation(updated)
    },
    [mediaDuration, newChapters, runValidation]
  )

  const handleChapterRemove = useCallback(
    (chapterId: number) => {
      if (lockedChapters.has(chapterId)) {
        showToast(t('ToastChapterLocked'), { type: 'warning' })
        return
      }
      runValidation(removeChapterAt(newChapters, chapterId))
    },
    [lockedChapters, newChapters, runValidation, showToast, t]
  )

  const handleChapterInsertBelow = useCallback(
    (chapter: EditableChapter) => {
      runValidation(insertChapterBelow(newChapters, chapter))
    },
    [newChapters, runValidation]
  )

  const isStreaming = !!streamLibraryItem

  return {
    libraryItem,
    title,
    media,
    mediaDuration,
    mediaDurationRounded,
    savedChapters,
    tracks,
    newChapters,
    dirtyBaseline,
    displayCurrentChapters,
    stagedChapters,
    isTransformPreviewOpen,
    canApplyStagedTransform,
    hasChanges,
    lockedChapters,
    showSecondInputs,
    activeToolbarPanel,
    lookupResult,
    lookupResultForPreview,
    isLookupPending,
    lookupAsinError,
    shiftAmount,
    previewShiftAmount,
    bulkChapterInput,
    removeBranding,
    mapChapterTitles,
    showBulkPatternPanel,
    showShiftTimes,
    detectedPattern,
    bulkChapterCount,
    isTableEditMode,
    confirmState,
    isPending,
    preview,
    allChaptersLocked,
    isStreaming,
    setShowSecondInputs,
    setActiveToolbarPanel,
    toggleToolbarPanel,
    closeToolbarPanel,
    closeShiftTimesPanel,
    toggleShiftTimesPanel,
    handleShiftAmountChange,
    setPreviewShiftAmount,
    setLookupResult,
    handleLookupResult,
    setBulkChapterInput,
    setRemoveBranding,
    setMapChapterTitles,
    setShowBulkPatternPanel,
    setBulkChapterCount,
    setDetectedPattern,
    setIsTableEditMode,
    toggleTableEditMode,
    setConfirmState,
    handleSave,
    applyStagedTransform,
    handleRemoveAll,
    toggleChapterLock,
    toggleAllChaptersLock,
    handleBulkChapterAdd,
    handleAddBulkChapters,
    handleAdjustChapterStartTime,
    handleChapterStartChange,
    handleChapterTitleDraft,
    handleChapterTitleCommit,
    handleChapterIncrementTime,
    handleChapterRemove,
    handleChapterInsertBelow,
    resetEditorChapters,
    resetEditorState
  }
}
