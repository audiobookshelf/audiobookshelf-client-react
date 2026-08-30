import { useMediaContext } from '@/contexts/MediaContext'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { resolveNextTarget, resolvePreviousTarget } from '@/lib/chapters/chapterPlayback'
import { isPodcastLibraryItem, type LibraryItem } from '@/types/api'
import { useCallback } from 'react'

/** Shared prev/next chapter or queue navigation used by player controls and Media Session. */
export function usePlayerChapterQueueNavigation(playerHandler: PlayerHandler, streamLibraryItem: LibraryItem | null) {
  const { hasNextItemInQueue, hasPreviousItemInQueue, playNextInQueue, playPreviousInQueue } = useMediaContext()
  const { seek, getCurrentTime } = playerHandler.controls
  const { chapters } = playerHandler.state
  const isPodcast = streamLibraryItem ? isPodcastLibraryItem(streamLibraryItem) : false

  const handleNext = useCallback(() => {
    const target = resolveNextTarget(chapters, getCurrentTime())

    if (target !== null) {
      seek(target)
    } else if (hasNextItemInQueue) {
      void playNextInQueue()
    }
  }, [chapters, getCurrentTime, hasNextItemInQueue, playNextInQueue, seek])

  const handlePrevious = useCallback(() => {
    const target = resolvePreviousTarget(chapters, getCurrentTime())

    if (target === null && hasPreviousItemInQueue) {
      void playPreviousInQueue()
      return
    }

    seek(target ?? 0)
  }, [chapters, getCurrentTime, hasPreviousItemInQueue, playPreviousInQueue, seek])

  return { handleNext, handlePrevious, hasNextItemInQueue, hasPreviousItemInQueue, isPodcast, chapters }
}
