'use client'

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
        onClose={() => setIsSettingsModalOpen(false)}
        onUpdateSettings={playerHandler.controls.updateSettings}
      />
      <ChaptersModal isOpen={isChaptersModalOpen} playerHandler={playerHandler} onClose={() => setIsChaptersModalOpen(false)} />
      {!isPodcast && (
        <BookmarksModal
          isOpen={isBookmarksModalOpen}
          bookmarks={bookmarks}
          currentTime={bookmarkCurrentTime}
          libraryItemId={libraryItemId}
          playbackRate={settings.playbackRate}
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
        onClose={() => setIsSleepTimerModalOpen(false)}
        onSet={setSleepTimer}
        onCancel={() => {
          setIsSleepTimerModalOpen(false)
          cancelSleepTimer()
        }}
        onIncrement={incrementSleepTimer}
        onDecrement={decrementSleepTimer}
      />
      <QueueItemsModal isOpen={isQueueModalOpen} onClose={() => setIsQueueModalOpen(false)} />
    </>
  )
}
