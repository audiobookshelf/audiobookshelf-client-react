'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { mergeClasses } from '@/lib/merge-classes'
import type { PlayerControlsState } from './usePlayerControlsState'

const PLAYER_TRANSPORT_CLASS = 'flex items-center justify-center'
const PLAYER_TRANSPORT_MINI_CLASS = 'gap-1'
const PLAYER_TRANSPORT_DESKTOP_MINI_CLASS = 'gap-2 xl:gap-3'
const PLAYER_TRANSPORT_FULLSCREEN_CLASS = 'gap-4'

const PLAYER_JUMP_CLASS = 'player-jump-btn cursor-pointer'
const PLAYER_JUMP_MINI_CLASS = 'h-11 min-h-11 w-11 min-w-11 text-2xl'
const PLAYER_JUMP_DESKTOP_MINI_CLASS = 'h-9 min-h-9 w-9 min-w-9 text-[1.625rem] xl:h-10 xl:min-h-10 xl:w-10 xl:min-w-10 xl:text-3xl'
const PLAYER_JUMP_FULLSCREEN_CLASS = 'h-12 min-h-12 w-12 min-w-12 text-[1.75rem]'

const PLAYER_PLAY_CLASS = 'player-play-btn bg-accent text-primary hover:text-primary hover:not-disabled:text-primary cursor-pointer rounded-full'
const PLAYER_PLAY_MINI_CLASS = 'h-11 min-h-11 w-11 min-w-11 text-[1.375rem]'
const PLAYER_PLAY_DESKTOP_MINI_CLASS = 'h-[2.375rem] w-[2.375rem] text-[1.375rem] xl:h-10 xl:w-10 xl:text-2xl'
const PLAYER_PLAY_FULLSCREEN_CLASS = 'h-16 min-h-16 w-16 min-w-16 text-[2.1rem]'

const PLAYER_CHAPTER_SLOT_CLASS = 'flex min-w-0 w-0 overflow-hidden opacity-0 invisible pointer-events-none'
const PLAYER_CHAPTER_SLOT_LG_CLASS = 'lg:w-auto lg:overflow-visible lg:opacity-100 lg:visible lg:pointer-events-auto'
const PLAYER_CHAPTER_SLOT_REVEALED_CLASS = 'w-auto overflow-visible opacity-100 visible pointer-events-auto'

const PLAYER_TRANSPORT_TOOLTIP_CLASS = 'items-center justify-center leading-[0]'

interface PlayerTransportControlsProps {
  controls: PlayerControlsState
  /** Mobile mini bar: jump back, play, and jump forward beside the title row. */
  variant?: 'mini' | 'full'
  isFullscreen?: boolean
}

export default function PlayerTransportControls({ controls, variant = 'full', isFullscreen = false }: PlayerTransportControlsProps) {
  const {
    isLoading,
    isPlaying,
    hasNext,
    handlePreviousChapter,
    handleNextChapter,
    jumpBackward,
    jumpForward,
    playPause,
    jumpBackwardTooltipText,
    jumpForwardTooltipText,
    nextButtonTooltipText,
    previousButtonTooltipText
  } = controls

  const isMini = variant === 'mini'
  const jumpSizeClass = isMini ? PLAYER_JUMP_MINI_CLASS : isFullscreen ? PLAYER_JUMP_FULLSCREEN_CLASS : PLAYER_JUMP_DESKTOP_MINI_CLASS
  const playSizeClass = isMini ? PLAYER_PLAY_MINI_CLASS : isFullscreen ? PLAYER_PLAY_FULLSCREEN_CLASS : PLAYER_PLAY_DESKTOP_MINI_CLASS
  const jumpClass = mergeClasses(PLAYER_JUMP_CLASS, jumpSizeClass)
  const tooltipClass = isMini || isFullscreen ? PLAYER_TRANSPORT_TOOLTIP_CLASS : undefined

  return (
    <div
      className={mergeClasses(
        'player-transport',
        PLAYER_TRANSPORT_CLASS,
        isMini ? PLAYER_TRANSPORT_MINI_CLASS : isFullscreen ? PLAYER_TRANSPORT_FULLSCREEN_CLASS : PLAYER_TRANSPORT_DESKTOP_MINI_CLASS
      )}
    >
      {!isMini && (
        <div
          className={mergeClasses(
            'player-chapter-slot',
            PLAYER_CHAPTER_SLOT_CLASS,
            isFullscreen ? PLAYER_CHAPTER_SLOT_REVEALED_CLASS : PLAYER_CHAPTER_SLOT_LG_CLASS
          )}
        >
          <Tooltip text={previousButtonTooltipText} position="top" className={tooltipClass}>
            <IconBtn borderless size="custom" className={jumpClass} onClick={handlePreviousChapter}>
              first_page
            </IconBtn>
          </Tooltip>
        </div>
      )}
      <Tooltip text={jumpBackwardTooltipText} position="top" className={tooltipClass}>
        <IconBtn borderless size="custom" className={mergeClasses(jumpClass, 'player-transport-jump-back')} onClick={jumpBackward}>
          replay
        </IconBtn>
      </Tooltip>
      <IconBtn borderless size="custom" loading={isLoading} outlined={false} className={mergeClasses(PLAYER_PLAY_CLASS, playSizeClass)} onClick={playPause}>
        {isPlaying ? 'pause' : 'play_arrow'}
      </IconBtn>
      <Tooltip text={jumpForwardTooltipText} position="top" className={tooltipClass}>
        <IconBtn borderless size="custom" className={mergeClasses(jumpClass, 'player-transport-jump-forward')} onClick={jumpForward}>
          forward_media
        </IconBtn>
      </Tooltip>
      {!isMini && (
        <div
          className={mergeClasses(
            'player-chapter-slot',
            PLAYER_CHAPTER_SLOT_CLASS,
            isFullscreen ? PLAYER_CHAPTER_SLOT_REVEALED_CLASS : PLAYER_CHAPTER_SLOT_LG_CLASS
          )}
        >
          <Tooltip text={nextButtonTooltipText} position="top" className={tooltipClass}>
            <IconBtn borderless size="custom" className={jumpClass} disabled={!hasNext} onClick={handleNextChapter}>
              last_page
            </IconBtn>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
