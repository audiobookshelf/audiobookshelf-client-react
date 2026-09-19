'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { PLAYER_OVERLAY_Z_CLASS } from '@/lib/player/constants'
import BookmarksModal from './BookmarksModal'
import ChaptersModal from './ChaptersModal'
import PlayerSettingsModal from './PlayerSettingsModal'
import QueueItemsModal from './QueueItemsModal'
import SleepTimerModal from './SleepTimerModal'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerModalsProps {
  controls: PlayerControlsState
}

export default function PlayerModals({ controls }: PlayerModalsProps) {
  const { isPlayerFullscreen } = useMediaContext()
  const playerOverlayZIndex = isPlayerFullscreen ? PLAYER_OVERLAY_Z_CLASS : undefined

  const {
    playerHandler,
    streamLibraryItem,
    isPodcast,
    chapters,
    bookmarks,
    seek,
    bookmarkCurrentTime,
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
    sleepTimer
  } = controls

  const { sleepTimerSet, sleepTimerRemaining, sleepTimerType, setSleepTimer, cancelSleepTimer, incrementSleepTimer, decrementSleepTimer } = sleepTimer
  const { settings } = playerHandler.state
  const libraryItemId = streamLibraryItem.id

  return (
    <>
      <PlayerSettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        hasChapters={chapters.length > 0}
        zIndexClass={playerOverlayZIndex}
        onClose={() => setIsSettingsModalOpen(false)}
        onUpdateSettings={playerHandler.controls.updateSettings}
      />
      <ChaptersModal
        isOpen={isChaptersModalOpen}
        playerHandler={playerHandler}
        zIndexClass={playerOverlayZIndex}
        onClose={() => setIsChaptersModalOpen(false)}
      />
      {!isPodcast && (
        <BookmarksModal
          isOpen={isBookmarksModalOpen}
          bookmarks={bookmarks}
          currentTime={bookmarkCurrentTime}
          libraryItemId={libraryItemId}
          playbackRate={settings.playbackRate}
          zIndexClass={playerOverlayZIndex}
          onClose={() => setIsBookmarksModalOpen(false)}
          onSelect={(bookmark) => seek(bookmark.time)}
        />
      )}
      <SleepTimerModal
        isOpen={isSleepTimerModalOpen}
        timerSet={sleepTimerSet}
        timerType={sleepTimerType}
        remaining={sleepTimerRemaining}
        hasChapters={chapters.length > 0}
        zIndexClass={playerOverlayZIndex}
        onClose={() => setIsSleepTimerModalOpen(false)}
        onSet={setSleepTimer}
        onCancel={() => {
          setIsSleepTimerModalOpen(false)
          cancelSleepTimer()
        }}
        onIncrement={incrementSleepTimer}
        onDecrement={decrementSleepTimer}
      />
      <QueueItemsModal isOpen={isQueueModalOpen} zIndexClass={playerOverlayZIndex} onClose={() => setIsQueueModalOpen(false)} />
    </>
  )
}
