import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useSleepTimer } from '@/hooks/useSleepTimer'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { isPodcastLibraryItem, LibraryItem, PlayerState } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'
import IconBtn from '../ui/IconBtn'
import Tooltip from '../ui/Tooltip'
import BookmarksModal from './BookmarksModal'
import ChaptersModal from './ChaptersModal'
import PlaybackRateWidget from './PlaybackRateWidget'
import PlayerSettingsModal from './PlayerSettingsModal'
import SleepTimerModal from './SleepTimerModal'
import VolumeControl from './VolumeControl'

interface PlayerControlsProps {
  playerHandler: PlayerHandler
  streamLibraryItem: LibraryItem
}

export default function PlayerControls({ playerHandler, streamLibraryItem }: PlayerControlsProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { getBookmarksForLibraryItem } = useUser()
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isChaptersModalOpen, setIsChaptersModalOpen] = useState(false)
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false)
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState(false)
  const [bookmarkCurrentTime, setBookmarkCurrentTime] = useState(0)
  const { jumpBackward, jumpForward, playPause, seek, pause } = playerHandler.controls
  const { nextChapter, previousChapter, currentChapter, playerState, currentTime, settings, chapters } = playerHandler.state

  const handleSleepTimerEnd = useCallback(() => {
    showToast(t('ToastSleepTimerDone'), { type: 'info' })
  }, [showToast, t])

  const { sleepTimerSet, sleepTimerRemaining, sleepTimerType, remainingString, setSleepTimer, cancelSleepTimer, incrementSleepTimer, decrementSleepTimer } =
    useSleepTimer({
      pause,
      currentChapter,
      currentTime,
      playbackRate: settings.playbackRate,
      onTimerEnd: handleSleepTimerEnd
    })

  const libraryItemId = streamLibraryItem.id
  const isPodcast = isPodcastLibraryItem(streamLibraryItem)
  const bookmarks = useMemo(() => getBookmarksForLibraryItem(libraryItemId), [libraryItemId, getBookmarksForLibraryItem])

  const isPlaying = playerState === PlayerState.PLAYING
  const isLoading = playerState === PlayerState.LOADING

  const getJumpTooltipText = (prefix: string, jumpTime: number) => {
    const timeText = jumpTime <= 60 ? t('LabelTimeDurationXSeconds', { 0: jumpTime }) : t('LabelTimeDurationXMinutes', { 0: jumpTime / 60 })
    return `${prefix} - ${timeText}`
  }

  const jumpBackwardTooltipText = getJumpTooltipText(t('ButtonJumpBackward'), settings.jumpBackwardAmount)
  const jumpForwardTooltipText = getJumpTooltipText(t('ButtonJumpForward'), settings.jumpForwardAmount)

  const handleNextChapter = () => {
    if (nextChapter) {
      seek(nextChapter.start)
    } else {
      // TODO: Implement next in queue
    }
  }

  const handlePreviousChapter = () => {
    if (previousChapter) {
      // if time in current chapter is less than 3 seconds then seek to start of previous chapter
      // otherwise seek to start of current chapter
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
  }

  return (
    <>
      <div className="mt-10 flex items-center">
        {/* Left spacer */}
        <div className="min-w-0 flex-1" />

        {/* Center - play controls */}
        <div className="flex shrink-0 items-center gap-4">
          {/* previous chapter */}
          <Tooltip text={t('ButtonPreviousChapter')} position="top">
            <IconBtn borderless size="custom" className="w-10 cursor-pointer text-3xl" onClick={handlePreviousChapter}>
              first_page
            </IconBtn>
          </Tooltip>
          {/* jump backward */}
          <Tooltip text={jumpBackwardTooltipText} position="top">
            <IconBtn borderless size="custom" className="w-10 cursor-pointer text-3xl" onClick={jumpBackward}>
              replay
            </IconBtn>
          </Tooltip>
          {/* play/pause */}
          <IconBtn
            borderless
            size="custom"
            loading={isLoading}
            outlined={false}
            className="bg-accent text-primary hover:text-primary hover:not-disabled:text-primary h-10 w-10 cursor-pointer rounded-full text-2xl"
            onClick={playPause}
          >
            {isPlaying ? 'pause' : 'play_arrow'}
          </IconBtn>
          {/* jump forward */}
          <Tooltip text={jumpForwardTooltipText} position="top">
            <IconBtn borderless size="custom" className="w-10 cursor-pointer text-3xl" onClick={jumpForward}>
              forward_media
            </IconBtn>
          </Tooltip>
          {/* next chapter */}
          <Tooltip text={t('ButtonNextChapter')} position="top">
            <IconBtn borderless size="custom" className="w-10 cursor-pointer text-3xl" onClick={handleNextChapter}>
              last_page
            </IconBtn>
          </Tooltip>
        </div>

        {/* Right section settings buttons */}
        <div className="flex min-w-0 flex-1 justify-end">
          <div className="flex items-center gap-4">
            {/* volume control */}
            <VolumeControl playerHandler={playerHandler} />
            {/* playback rate widget */}
            <PlaybackRateWidget playerHandler={playerHandler} />
            {/* sleep timer button */}
            <Tooltip text={t('LabelSleepTimer')} position="top">
              <button
                type="button"
                aria-label={t('LabelSleepTimer')}
                className="text-foreground-muted hover:text-foreground mx-1 flex cursor-pointer items-center lg:mx-2"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsSleepTimerModalOpen(true)}
              >
                {!sleepTimerSet ? (
                  <span className="material-symbols text-2xl">snooze</span>
                ) : (
                  <div className="flex items-center">
                    <span className="material-symbols text-warning text-lg">snooze</span>
                    <p className="text-warning min-w-8 px-0.5 text-center text-sm font-semibold sm:pb-0.5 sm:text-lg">{remainingString}</p>
                  </div>
                )}
              </button>
            </Tooltip>
            {/* bookmarks button */}
            {!isPodcast && (
              <Tooltip text={t('LabelViewBookmarks')} position="top">
                <IconBtn
                  size="custom"
                  borderless
                  className="w-10 text-2xl"
                  onClick={() => {
                    setBookmarkCurrentTime(currentTime)
                    setIsBookmarksModalOpen(true)
                  }}
                  ariaLabel={t('LabelViewBookmarks')}
                >
                  {bookmarks.length ? 'bookmarks' : 'bookmark_border'}
                </IconBtn>
              </Tooltip>
            )}
            {/* chapters button */}
            {chapters.length > 0 && (
              <Tooltip text={t('LabelViewChapters')} position="top">
                <IconBtn size="custom" borderless className="w-10 text-2xl" onClick={() => setIsChaptersModalOpen(true)} ariaLabel={t('LabelViewChapters')}>
                  format_list_bulleted
                </IconBtn>
              </Tooltip>
            )}
            {/* player settings button */}
            <Tooltip text={t('LabelViewPlayerSettings')} position="top">
              <IconBtn size="custom" borderless className="w-10 text-2xl" onClick={() => setIsSettingsModalOpen(true)} ariaLabel={t('LabelViewPlayerSettings')}>
                settings_slow_motion
              </IconBtn>
            </Tooltip>
          </div>
        </div>
      </div>
      <PlayerSettingsModal
        isOpen={isSettingsModalOpen}
        settings={playerHandler.state.settings}
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
    </>
  )
}
