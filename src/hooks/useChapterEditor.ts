'use client'

import { updateChaptersAction } from '@/app/actions/chapterActions'
import { getExpandedLibraryItemAction } from '@/app/actions/mediaActions'
import { useMediaContext } from '@/contexts/MediaContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useChapterPreviewAudio } from '@/hooks/useChapterPreviewAudio'
import { useItemPageSocket } from '@/hooks/useItemPageSocket'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import {
  addSingleChapterFromInput,
  adjustChapterStartTime,
  buildBulkChapters,
  computeChapterEnds,
  detectBulkChapterPattern,
  incrementChapterTime,
  initChapters,
  insertChapterBelow,
  mergeAudibleChapterData,
  mergeAudibleChapterTitles,
  removeChapterAt,
  setChaptersFromTracks,
  shiftChapterTimes,
  updateChapterStart,
  updateChapterTitle,
  validateChapters,
  type BulkChapterPattern,
  type EditableChapter
} from '@/lib/chapters/chapterEditorUtils'
import type { AudibleChapterSearchResult, BookLibraryItem, Chapter } from '@/types/api'
import { useCallback, useMemo, useState, useTransition } from 'react'

interface UseChapterEditorOptions {
  initialLibraryItem: BookLibraryItem
}

export function useChapterEditor({ initialLibraryItem }: UseChapterEditorOptions) {
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
  const tracks = media.tracks || []
  const audioFiles = useMemo(() => media.audioFiles || [], [media.audioFiles])
  const title = media.metadata.title ?? ''

  const [newChapters, setNewChapters] = useState<EditableChapter[]>(() => initChapters(savedChapters, mediaDuration))
  const [hasChanges, setHasChanges] = useState(false)
  const [lockedChapters, setLockedChapters] = useState<Set<number>>(() => new Set())
  const [lastSelectedLockIndex, setLastSelectedLockIndex] = useState<number | null>(null)
  const [showSecondInputs, setShowSecondInputs] = useState(false)
  const [showShiftTimes, setShowShiftTimes] = useState(false)
  const [shiftAmount, setShiftAmount] = useState(0)
  const [bulkChapterInput, setBulkChapterInput] = useState('')
  const [showFindChaptersModal, setShowFindChaptersModal] = useState(false)
  const [removeBranding, setRemoveBranding] = useState(false)
  const [showAddMultipleChaptersModal, setShowAddMultipleChaptersModal] = useState(false)
  const [detectedPattern, setDetectedPattern] = useState<BulkChapterPattern | null>(null)
  const [bulkChapterCount, setBulkChapterCount] = useState(1)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [chapterListKey, setChapterListKey] = useState(0)

  const validationMessages = useMemo(
    () => ({
      firstNotZero: t('MessageChapterErrorFirstNotZero'),
      startLtPrev: t('MessageChapterErrorStartLtPrev'),
      startGteDuration: t('MessageChapterErrorStartGteDuration')
    }),
    [t]
  )

  const preview = useChapterPreviewAudio({ tracks, token })

  const allChaptersLocked = newChapters.length > 0 && newChapters.every((chapter) => lockedChapters.has(chapter.id))

  const runValidation = useCallback(
    (chapters: EditableChapter[], existingOverride?: Chapter[]) => {
      const result = validateChapters(chapters, existingOverride ?? savedChapters, mediaDuration, validationMessages)
      setNewChapters(result.chapters)
      setHasChanges(result.hasChanges)
      return result.chapters
    },
    [mediaDuration, savedChapters, validationMessages]
  )

  const replaceChapterList = useCallback(
    (chapters: EditableChapter[], existingOverride?: Chapter[]) => {
      setChapterListKey((key) => key + 1)
      return runValidation(chapters, existingOverride)
    },
    [runValidation]
  )

  const resetEditorChapters = useCallback(() => {
    setLockedChapters(new Set())
    replaceChapterList(initChapters(savedChapters, mediaDuration))
  }, [mediaDuration, replaceChapterList, savedChapters])

  const refreshAfterChapterUpdate = useCallback(
    async (successToast: string) => {
      showToast(successToast, { type: 'success' })
      const refreshed = await getExpandedLibraryItemAction(libraryItem.id)
      if (refreshed.mediaType === 'book') {
        const book = refreshed as BookLibraryItem
        setLibraryItem(book)
        const saved = book.media.chapters || []
        replaceChapterList(initChapters(saved, mediaDuration), saved)
        setLockedChapters(new Set())
      }
    },
    [libraryItem.id, mediaDuration, replaceChapterList, showToast]
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

  const handleSave = useCallback(() => {
    const validated = runValidation([...newChapters])

    for (const chapter of validated) {
      if (chapter.error) {
        showToast(t('ToastChaptersHaveErrors'), { type: 'error' })
        return
      }
      if (!chapter.title) {
        showToast(t('ToastChaptersMustHaveTitles'), { type: 'error' })
        return
      }
    }

    const payload = computeChapterEnds(validated, mediaDuration)

    const successToast = payload.length === 0 ? t('ToastChaptersRemoved') : t('ToastChaptersUpdated')

    startTransition(async () => {
      try {
        const data = await updateChaptersAction(libraryItem.id, payload)
        if (data.updated) {
          await refreshAfterChapterUpdate(successToast)
        } else {
          showToast(t('MessageNoUpdatesWereNecessary'), { type: 'info' })
        }
      } catch (error) {
        console.error('Failed to update chapters', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    })
  }, [libraryItem.id, mediaDuration, newChapters, refreshAfterChapterUpdate, runValidation, showToast, t])

  const handleRemoveAll = useCallback(() => {
    replaceChapterList([])
    setLockedChapters(new Set())
  }, [replaceChapterList])

  const handleShiftChapterTimes = useCallback(() => {
    if (!shiftAmount || isNaN(shiftAmount) || newChapters.length <= 1) return

    const unlocked = newChapters.filter((ch) => !lockedChapters.has(ch.id))
    if (unlocked.length === 0) {
      showToast(t('ToastChaptersAllLocked'), { type: 'warning' })
      return
    }

    runValidation(shiftChapterTimes(newChapters, shiftAmount, lockedChapters, mediaDuration))
  }, [lockedChapters, mediaDuration, newChapters, runValidation, shiftAmount, showToast, t])

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
      setDetectedPattern(pattern)
      setBulkChapterCount(1)
      setShowAddMultipleChaptersModal(true)
    } else {
      replaceChapterList(addSingleChapterFromInput(input, newChapters, mediaDuration))
      setBulkChapterInput('')
    }
  }, [bulkChapterInput, mediaDuration, newChapters, replaceChapterList])

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
    setShowAddMultipleChaptersModal(false)
    setDetectedPattern(null)
  }, [bulkChapterCount, detectedPattern, mediaDuration, newChapters, replaceChapterList, showToast, t])

  const handleApplyTitles = useCallback(
    (data: AudibleChapterSearchResult) => {
      replaceChapterList(mergeAudibleChapterTitles(newChapters, data, lockedChapters))
      setShowFindChaptersModal(false)
    },
    [lockedChapters, newChapters, replaceChapterList]
  )

  const handleApplyChapters = useCallback(
    (data: AudibleChapterSearchResult) => {
      replaceChapterList(mergeAudibleChapterData(newChapters, data, lockedChapters, mediaDuration))
      setShowFindChaptersModal(false)
    },
    [lockedChapters, mediaDuration, newChapters, replaceChapterList]
  )

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

  const handleChapterTitleChange = useCallback(
    (chapterId: number, chapterTitle: string) => {
      runValidation(updateChapterTitle(newChapters, chapterId, chapterTitle))
    },
    [newChapters, runValidation]
  )

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

  const handleSetChaptersFromTracks = useCallback(() => {
    replaceChapterList(setChaptersFromTracks(audioFiles))
    setLockedChapters(new Set())
  }, [audioFiles, replaceChapterList])

  const handleLibraryItemSaved = useCallback((updated: BookLibraryItem) => {
    setLibraryItem(updated)
  }, [])

  const isStreaming = !!streamLibraryItem

  return {
    libraryItem,
    title,
    media,
    mediaDuration,
    mediaDurationRounded,
    savedChapters,
    audioFiles,
    newChapters,
    hasChanges,
    lockedChapters,
    chapterListKey,
    showSecondInputs,
    showShiftTimes,
    shiftAmount,
    bulkChapterInput,
    showFindChaptersModal,
    removeBranding,
    showAddMultipleChaptersModal,
    detectedPattern,
    bulkChapterCount,
    isEditModalOpen,
    confirmState,
    isPending,
    preview,
    allChaptersLocked,
    isStreaming,
    setShowSecondInputs,
    setShowShiftTimes,
    setShiftAmount,
    setBulkChapterInput,
    setShowFindChaptersModal,
    setRemoveBranding,
    setShowAddMultipleChaptersModal,
    setBulkChapterCount,
    setIsEditModalOpen,
    setConfirmState,
    handleSave,
    handleRemoveAll,
    handleShiftChapterTimes,
    toggleChapterLock,
    toggleAllChaptersLock,
    handleBulkChapterAdd,
    handleAddBulkChapters,
    handleApplyTitles,
    handleApplyChapters,
    handleAdjustChapterStartTime,
    handleChapterStartChange,
    handleChapterTitleChange,
    handleChapterIncrementTime,
    handleChapterRemove,
    handleChapterInsertBelow,
    handleSetChaptersFromTracks,
    handleLibraryItemSaved,
    resetEditorChapters
  }
}
