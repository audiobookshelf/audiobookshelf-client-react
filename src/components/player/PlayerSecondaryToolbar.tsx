'use client'

import ButtonBase from '@/components/ui/ButtonBase'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import PlaybackRateWidget from './PlaybackRateWidget'
import type { PlayerControlsState } from './usePlayerControlsState'
import VolumeControl from './VolumeControl'

interface PlayerSecondaryToolbarProps {
  controls: PlayerControlsState
}

export default function PlayerSecondaryToolbar({ controls }: PlayerSecondaryToolbarProps) {
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
    <div className="flex shrink-0 flex-nowrap items-center justify-center gap-1">
      <VolumeControl playerHandler={playerHandler} />
      <PlaybackRateWidget playerHandler={playerHandler} />
      <Tooltip text={t('LabelSleepTimer')} position="top">
        <ButtonBase
          size="large"
          borderless
          className="min-w-11 text-2xl"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsSleepTimerModalOpen(true)}
          ariaLabel={sleepTimerSet ? t('AriaLabelSleepTimerActive') : t('LabelSleepTimer')}
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
          <IconBtn size="large" borderless onClick={openBookmarksModal} ariaLabel={t('LabelViewBookmarks')}>
            {bookmarks.length ? 'bookmarks' : 'bookmark_border'}
          </IconBtn>
        </Tooltip>
      )}
      {chapters.length > 0 && (
        <Tooltip text={t('LabelViewChapters')} position="top">
          <IconBtn size="large" borderless onClick={() => setIsChaptersModalOpen(true)} ariaLabel={t('LabelViewChapters')}>
            format_list_bulleted
          </IconBtn>
        </Tooltip>
      )}
      {playerQueueItems.length > 0 && (
        <Tooltip text={t('LabelViewQueue')} position="top">
          <IconBtn
            size="large"
            borderless
            // Same box as its neighbours; only the glyph is a size up, since `playlist_play`
            // draws smaller than the rest at the same font size
            iconClass="text-3xl"
            onClick={() => setIsQueueModalOpen(true)}
            ariaLabel={t('LabelViewQueue')}
          >
            playlist_play
          </IconBtn>
        </Tooltip>
      )}
      <Tooltip text={t('LabelViewPlayerSettings')} position="top">
        <IconBtn size="large" borderless onClick={() => setIsSettingsModalOpen(true)} ariaLabel={t('LabelViewPlayerSettings')}>
          settings_slow_motion
        </IconBtn>
      </Tooltip>
    </div>
  )
}
