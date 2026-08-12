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
  /** `lg` clears the 44px touch minimum — used by the fullscreen player, which is touch-first */
  size?: 'default' | 'lg'
  className?: string
}

export default function PlayerSecondaryToolbar({ controls, size = 'default', className }: PlayerSecondaryToolbarProps) {
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

  const isLarge = size === 'lg'
  // shrink-0 plus wrapping rather than flex-nowrap: on a narrow phone the row moves to a second
  // line instead of squeezing the targets below the 44px touch minimum.
  // `size="custom"` emits no height of its own, so every branch has to supply one — without it
  // the button collapses to the icon's line box and the target is ~32px tall.
  const btnClass = isLarge ? 'h-11 w-11 shrink-0 text-3xl' : 'h-9 w-9 text-2xl sm:h-10 sm:w-10'
  const sleepBtnClass = isLarge ? 'h-11 min-w-11 shrink-0 text-3xl' : 'h-9 min-w-9 text-2xl sm:h-10 sm:min-w-10'
  const sleepAriaLabel = sleepTimerSet ? `${t('LabelSleepTimer')}: ${remainingString}` : t('LabelSleepTimer')

  return (
    <div className={mergeClasses('flex items-center justify-center', isLarge ? 'flex-wrap gap-x-1 gap-y-1' : 'flex-nowrap gap-3 sm:gap-4', className)}>
      <VolumeControl playerHandler={playerHandler} size={size} />
      <PlaybackRateWidget playerHandler={playerHandler} size={size} />
      <Tooltip text={t('LabelSleepTimer')} position="top">
        <ButtonBase
          size="custom"
          borderless
          className={sleepBtnClass}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsSleepTimerModalOpen(true)}
          ariaLabel={sleepAriaLabel}
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
          <IconBtn size="custom" borderless className={btnClass} onClick={openBookmarksModal} ariaLabel={t('LabelViewBookmarks')}>
            {bookmarks.length ? 'bookmarks' : 'bookmark_border'}
          </IconBtn>
        </Tooltip>
      )}
      {chapters.length > 0 && (
        <Tooltip text={t('LabelViewChapters')} position="top">
          <IconBtn size="custom" borderless className={btnClass} onClick={() => setIsChaptersModalOpen(true)} ariaLabel={t('LabelViewChapters')}>
            format_list_bulleted
          </IconBtn>
        </Tooltip>
      )}
      {playerQueueItems.length > 0 && (
        <Tooltip text={t('LabelViewQueue')} position="top">
          <IconBtn
            size="custom"
            borderless
            className={isLarge ? btnClass : 'w-9 text-2xl sm:w-10 sm:text-3xl'}
            onClick={() => setIsQueueModalOpen(true)}
            ariaLabel={t('LabelViewQueue')}
          >
            playlist_play
          </IconBtn>
        </Tooltip>
      )}
      <Tooltip text={t('LabelViewPlayerSettings')} position="top">
        <IconBtn size="custom" borderless className={btnClass} onClick={() => setIsSettingsModalOpen(true)} ariaLabel={t('LabelViewPlayerSettings')}>
          settings_slow_motion
        </IconBtn>
      </Tooltip>
    </div>
  )
}
