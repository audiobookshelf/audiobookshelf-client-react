import { useMediaContext } from '@/contexts/MediaContext'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { isPodcastLibraryItem, type LibraryItem } from '@/types/api'
import { useCallback } from 'react'

/** Shared prev/next chapter or queue navigation used by player controls and Media Session. */
export function usePlayerChapterQueueNavigation(playerHandler: PlayerHandler, streamLibraryItem: LibraryItem | null) {
  const { hasNextItemInQueue, hasPreviousItemInQueue, playNextInQueue, playPreviousInQueue } = useMediaContext()
  const { seek, getCurrentTime } = playerHandler.controls
  const { nextChapter, previousChapter, currentChapter, chapters } = playerHandler.state
  const isPodcast = streamLibraryItem ? isPodcastLibraryItem(streamLibraryItem) : false

  const handleNext = useCallback(() => {
    if (nextChapter) {
      seek(nextChapter.start)
    } else if (hasNextItemInQueue) {
      void playNextInQueue()
    }
  }, [hasNextItemInQueue, nextChapter, playNextInQueue, seek])

  const handlePrevious = useCallback(() => {
    const currentTime = getCurrentTime()

    if (chapters.length > 0) {
      if (previousChapter) {
        const currentChapterStart = currentChapter?.start ?? 0
        const timeInCurrentChapter = currentTime - currentChapterStart
        if (timeInCurrentChapter <= 3) {
          seek(previousChapter.start)
        } else {
          seek(currentChapterStart)
        }
      } else {
        seek(0)
      }
      return
    }

    if (hasPreviousItemInQueue && currentTime <= 3) {
      void playPreviousInQueue()
      return
    }

    seek(0)
  }, [chapters.length, currentChapter?.start, getCurrentTime, hasPreviousItemInQueue, playPreviousInQueue, previousChapter, seek])

  return { handleNext, handlePrevious, hasNextItemInQueue, hasPreviousItemInQueue, isPodcast, chapters }
}
