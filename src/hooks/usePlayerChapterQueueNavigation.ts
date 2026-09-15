import { useMediaContext } from '@/contexts/MediaContext'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { isPodcastLibraryItem, type LibraryItem } from '@/types/api'
import { useCallback } from 'react'

/** Shared prev/next chapter or queue navigation used by player controls and Media Session. */
export function usePlayerChapterQueueNavigation(playerHandler: PlayerHandler, streamLibraryItem: LibraryItem | null) {
  const { hasNextItemInQueue, hasPreviousItemInQueue, playNextInQueue, playPreviousInQueue } = useMediaContext()
  const { seek, getCurrentTime } = playerHandler.controls
  const { chapters } = playerHandler.state
  const isPodcast = streamLibraryItem ? isPodcastLibraryItem(streamLibraryItem) : false

  const handleNext = useCallback(() => {
    const currentTime = getCurrentTime()
    const nextChapter = chapters.find((chapter) => chapter.start > currentTime && chapter.end > currentTime) ?? null

    if (nextChapter) {
      seek(nextChapter.start)
    } else if (hasNextItemInQueue) {
      void playNextInQueue()
    }
  }, [chapters, getCurrentTime, hasNextItemInQueue, playNextInQueue, seek])

  const handlePrevious = useCallback(() => {
    const currentTime = getCurrentTime()
    const currentChapter = chapters.find((chapter) => chapter.start <= currentTime && chapter.end > currentTime) ?? null
    const previousChapter = chapters.findLast((chapter) => chapter.end <= currentTime && chapter.start < currentTime) ?? null

    if (chapters.length > 0) {
      if (previousChapter) {
        const currentChapterStart = currentChapter?.start ?? 0
        const timeInCurrentChapter = currentTime - currentChapterStart
        // Within the first few seconds of a chapter Previous goes back a chapter rather than restarting it,
        // so a quick second press keeps skipping backwards.
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
  }, [chapters, getCurrentTime, hasPreviousItemInQueue, playPreviousInQueue, seek])

  return { handleNext, handlePrevious, hasNextItemInQueue, hasPreviousItemInQueue, isPodcast, chapters }
}
