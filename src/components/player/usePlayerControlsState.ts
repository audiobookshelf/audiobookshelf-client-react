'use client'

import { useGlobalToast } from '@/contexts/ToastContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { useUser } from '@/contexts/UserContext'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { usePlayerChapterQueueNavigation } from '@/hooks/usePlayerChapterQueueNavigation'
import { useSleepTimer } from '@/hooks/useSleepTimer'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { LibraryItem, PlayerState } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'

export function usePlayerControlsState(playerHandler: PlayerHandler, streamLibraryItem: LibraryItem) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { getBookmarksForLibraryItem } = useUser()
  const { playerQueueItems } = useMediaContext()
  const {
    handleNext: handleNextChapter,
    handlePrevious: handlePreviousChapter,
    hasNextItemInQueue,
    hasPreviousItemInQueue,
    isPodcast,
    chapters
  } = usePlayerChapterQueueNavigation(playerHandler, streamLibraryItem)

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isChaptersModalOpen, setIsChaptersModalOpen] = useState(false)
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false)
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState(false)
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false)
  const [bookmarkCurrentTime, setBookmarkCurrentTime] = useState(0)

  const { jumpBackward, jumpForward, playPause, seek, pause } = playerHandler.controls
  const { nextChapter, previousChapter, currentChapter, playerState, currentTime, settings } = playerHandler.state

  const handleSleepTimerEnd = useCallback(() => {
    showToast(t('ToastSleepTimerDone'), { type: 'info' })
  }, [showToast, t])

  const sleepTimer = useSleepTimer({
    pause,
    currentChapter,
    currentTime,
    playbackRate: settings.playbackRate,
    onTimerEnd: handleSleepTimerEnd
  })

  const libraryItemId = streamLibraryItem.id
  const bookmarks = useMemo(() => getBookmarksForLibraryItem(libraryItemId), [libraryItemId, getBookmarksForLibraryItem])

  const isPlaying = playerState === PlayerState.PLAYING
  const isLoading = playerState === PlayerState.LOADING

  const getJumpTooltipText = (prefix: string, jumpTime: number) => {
    const timeText = jumpTime <= 60 ? t('LabelTimeDurationXSeconds', { 0: jumpTime }) : t('LabelTimeDurationXMinutes', { 0: jumpTime / 60 })
    return `${prefix} - ${timeText}`
  }

  const jumpBackwardTooltipText = getJumpTooltipText(t('ButtonJumpBackward'), settings.jumpBackwardAmount)
  const jumpForwardTooltipText = getJumpTooltipText(t('ButtonJumpForward'), settings.jumpForwardAmount)
  const hasNext = !!nextChapter || hasNextItemInQueue
  const nextButtonTooltipText = hasNextItemInQueue && !nextChapter ? t('ButtonNextItemInQueue') : t('ButtonNextChapter')
  const previousButtonTooltipText = hasPreviousItemInQueue && !previousChapter ? t('ButtonPreviousItemInQueue') : t('ButtonPreviousChapter')

  const openBookmarksModal = useCallback(() => {
    setBookmarkCurrentTime(currentTime)
    setIsBookmarksModalOpen(true)
  }, [currentTime])

  return {
    playerHandler,
    streamLibraryItem,
    isPodcast,
    chapters,
    bookmarks,
    isPlaying,
    isLoading,
    hasNext,
    handleNextChapter,
    handlePreviousChapter,
    jumpBackward,
    jumpForward,
    playPause,
    seek,
    jumpBackwardTooltipText,
    jumpForwardTooltipText,
    nextButtonTooltipText,
    previousButtonTooltipText,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isChaptersModalOpen,
    setIsChaptersModalOpen,
    isBookmarksModalOpen,
    setIsBookmarksModalOpen,
    isSleepTimerModalOpen,
    setIsSleepTimerModalOpen,
    isQueueModalOpen,
    setIsQueueModalOpen,
    bookmarkCurrentTime,
    openBookmarksModal,
    playerQueueItems,
    sleepTimer,
    t
  }
}

export type PlayerControlsState = ReturnType<typeof usePlayerControlsState>
