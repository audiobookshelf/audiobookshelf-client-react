'use client'

import ButtonBase from '@/components/ui/ButtonBase'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { mergeClasses } from '@/lib/merge-classes'
import PlaybackRateWidget from './PlaybackRateWidget'
import type { PlayerControlsState } from './usePlayerControlsState'
import VolumeControl from './VolumeControl'

const PLAYER_SECONDARY_TOOLBAR_CLASS = 'flex flex-nowrap items-center justify-center gap-2'
const PLAYER_SECONDARY_TOOLBAR_FULLSCREEN_CLASS = mergeClasses(
  'max-lg:w-full max-lg:gap-[4px]',
  'max-lg:[&_button]:inline-flex max-lg:[&_button]:h-11 max-lg:[&_button]:min-h-11 max-lg:[&_button]:w-11 max-lg:[&_button]:min-w-11 max-lg:[&_button]:items-center max-lg:[&_button]:justify-center max-lg:[&_button]:p-0'
)
const PLAYER_TOOLBAR_TOOLTIP_CLASS = 'max-lg:items-center max-lg:justify-center max-lg:leading-[0]'

interface PlayerSecondaryToolbarProps {
  controls: PlayerControlsState
  isFullscreen?: boolean
  isLandscapeCompact?: boolean
  className?: string
  onPlaybackRateOpenChange?: (open: boolean) => void
  onVolumeOpenChange?: (open: boolean) => void
}

export default function PlayerSecondaryToolbar({
  controls,
  isFullscreen = false,
  isLandscapeCompact = false,
  className,
  onPlaybackRateOpenChange,
  onVolumeOpenChange
}: PlayerSecondaryToolbarProps) {
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
  const tooltipClass = isFullscreen ? PLAYER_TOOLBAR_TOOLTIP_CLASS : undefined

  return (
    <div
      className={mergeClasses(
        'player-secondary-toolbar',
        PLAYER_SECONDARY_TOOLBAR_CLASS,
        isFullscreen && PLAYER_SECONDARY_TOOLBAR_FULLSCREEN_CLASS,
        isLandscapeCompact && 'w-full',
        className
      )}
    >
      <VolumeControl playerHandler={playerHandler} onOpenChange={onVolumeOpenChange} />
      <PlaybackRateWidget playerHandler={playerHandler} onOpenChange={onPlaybackRateOpenChange} />
      <Tooltip text={t('LabelSleepTimer')} position="top" className={tooltipClass}>
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
              <span
                className={mergeClasses(
                  'player-sleep-timer-remaining text-warning min-w-6 px-0.5 text-center text-sm font-semibold tabular-nums sm:min-w-8 sm:text-lg',
                  isFullscreen && 'max-lg:hidden'
                )}
              >
                {remainingString}
              </span>
            </div>
          )}
        </ButtonBase>
      </Tooltip>
      {!isPodcast && (
        <Tooltip text={t('LabelViewBookmarks')} position="top" className={tooltipClass}>
          <IconBtn size="custom" borderless className="w-9 text-2xl sm:w-10" onClick={openBookmarksModal} ariaLabel={t('LabelViewBookmarks')}>
            {bookmarks.length ? 'bookmarks' : 'bookmark_border'}
          </IconBtn>
        </Tooltip>
      )}
      {chapters.length > 0 && (
        <Tooltip text={t('LabelViewChapters')} position="top" className={tooltipClass}>
          <IconBtn size="custom" borderless className="w-9 text-2xl sm:w-10" onClick={() => setIsChaptersModalOpen(true)} ariaLabel={t('LabelViewChapters')}>
            format_list_bulleted
          </IconBtn>
        </Tooltip>
      )}
      {playerQueueItems.length > 0 && (
        <Tooltip text={t('LabelViewQueue')} position="top" className={tooltipClass}>
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
      <Tooltip text={t('LabelViewPlayerSettings')} position="top" className={tooltipClass}>
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
