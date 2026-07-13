'use client'

import ButtonBase from '@/components/ui/ButtonBase'
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
    <div className={mergeClasses('flex flex-nowrap items-center justify-center gap-3 sm:gap-4', className)}>
      <VolumeControl playerHandler={playerHandler} />
      <PlaybackRateWidget playerHandler={playerHandler} />
      <Tooltip text={t('LabelSleepTimer')} position="top">
        <ButtonBase
          size="custom"
          borderless
          className="min-w-9 text-2xl sm:min-w-10"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsSleepTimerModalOpen(true)}
          ariaLabel={t('LabelSleepTimer')}
        >
          {!sleepTimerSet ? (
            <span className="material-symbols" aria-hidden="true">
              snooze
            </span>
          ) : (
            <div className="flex items-center">
              <span className="material-symbols text-warning text-lg" aria-hidden="true">
                snooze
              </span>
              <span className="text-warning min-w-6 px-0.5 text-center text-sm font-semibold tabular-nums sm:min-w-8 sm:text-lg">{remainingString}</span>
            </div>
          )}
        </ButtonBase>
      </Tooltip>
      {!isPodcast && (
        <Tooltip text={t('LabelViewBookmarks')} position="top">
          <IconBtn size="custom" borderless className="w-9 text-2xl sm:w-10" onClick={openBookmarksModal} ariaLabel={t('LabelViewBookmarks')}>
            {bookmarks.length ? 'bookmarks' : 'bookmark_border'}
          </IconBtn>
        </Tooltip>
      )}
      {chapters.length > 0 && (
        <Tooltip text={t('LabelViewChapters')} position="top">
          <IconBtn size="custom" borderless className="w-9 text-2xl sm:w-10" onClick={() => setIsChaptersModalOpen(true)} ariaLabel={t('LabelViewChapters')}>
            format_list_bulleted
          </IconBtn>
        </Tooltip>
      )}
      {playerQueueItems.length > 0 && (
        <Tooltip text={t('LabelViewQueue')} position="top">
          <IconBtn
            size="custom"
            borderless
            className="w-9 text-2xl sm:w-10 sm:text-3xl"
            onClick={() => setIsQueueModalOpen(true)}
            ariaLabel={t('LabelViewQueue')}
          >
            playlist_play
          </IconBtn>
        </Tooltip>
      )}
      <Tooltip text={t('LabelViewPlayerSettings')} position="top">
        <IconBtn
          size="custom"
          borderless
          className="w-9 text-2xl sm:w-10"
          onClick={() => setIsSettingsModalOpen(true)}
          ariaLabel={t('LabelViewPlayerSettings')}
        >
          settings_slow_motion
        </IconBtn>
      </Tooltip>
    </div>
  )
}
