'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { mergeClasses } from '@/lib/merge-classes'
import PlaybackRateWidget from './PlaybackRateWidget'
import type { PlayerControlsState } from './usePlayerControlsState'
import VolumeControl from './VolumeControl'

interface PlayerSecondaryToolbarProps {
  controls: PlayerControlsState
  className?: string
}

export default function PlayerSecondaryToolbar({ controls, className }: PlayerSecondaryToolbarProps) {
  const {
    playerHandler,
    isPodcast,
    chapters,
    bookmarks,
    openBookmarksModal,
    playerQueueItems,
    sleepTimer,
    t,
    setIsSleepTimerModalOpen,
    setIsChaptersModalOpen,
    setIsQueueModalOpen,
    setIsSettingsModalOpen
  } = controls

  const { sleepTimerSet, remainingString } = sleepTimer

  return (
    <div className={mergeClasses('flex flex-wrap items-center justify-center gap-3 sm:gap-4', className)}>
      <VolumeControl playerHandler={playerHandler} />
      <PlaybackRateWidget playerHandler={playerHandler} />
      <Tooltip text={t('LabelSleepTimer')} position="top">
        <button
          type="button"
          aria-label={t('LabelSleepTimer')}
          className="text-foreground-muted hover:text-foreground mx-1 flex cursor-pointer items-center"
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
      {!isPodcast && (
        <Tooltip text={t('LabelViewBookmarks')} position="top">
          <IconBtn size="custom" borderless className="w-10 text-2xl" onClick={openBookmarksModal} ariaLabel={t('LabelViewBookmarks')}>
            {bookmarks.length ? 'bookmarks' : 'bookmark_border'}
          </IconBtn>
        </Tooltip>
      )}
      {chapters.length > 0 && (
        <Tooltip text={t('LabelViewChapters')} position="top">
          <IconBtn size="custom" borderless className="w-10 text-2xl" onClick={() => setIsChaptersModalOpen(true)} ariaLabel={t('LabelViewChapters')}>
            format_list_bulleted
          </IconBtn>
        </Tooltip>
      )}
      {playerQueueItems.length > 0 && (
        <Tooltip text={t('LabelViewQueue')} position="top">
          <IconBtn size="custom" borderless className="w-10 text-2xl sm:text-3xl" onClick={() => setIsQueueModalOpen(true)} ariaLabel={t('LabelViewQueue')}>
            playlist_play
          </IconBtn>
        </Tooltip>
      )}
      <Tooltip text={t('LabelViewPlayerSettings')} position="top">
        <IconBtn size="custom" borderless className="w-10 text-2xl" onClick={() => setIsSettingsModalOpen(true)} ariaLabel={t('LabelViewPlayerSettings')}>
          settings_slow_motion
        </IconBtn>
      </Tooltip>
    </div>
  )
}
