'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { mergeClasses } from '@/lib/merge-classes'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerTransportControlsProps {
  controls: PlayerControlsState
  /** Tighter spacing and icons for mobile collapsed bar */
  compact?: boolean
  className?: string
}

export default function PlayerTransportControls({ controls, compact = false, className }: PlayerTransportControlsProps) {
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

  const iconClass = compact ? 'w-8 text-2xl' : 'w-10 text-3xl'
  const gapClass = compact ? 'gap-2' : 'gap-4'

  return (
    <div className={mergeClasses('flex items-center justify-center', gapClass, className)}>
      <Tooltip text={previousButtonTooltipText} position="top">
        <IconBtn borderless size="custom" className={mergeClasses(iconClass, 'cursor-pointer')} onClick={handlePreviousChapter}>
          first_page
        </IconBtn>
      </Tooltip>
      <Tooltip text={jumpBackwardTooltipText} position="top">
        <IconBtn borderless size="custom" className={mergeClasses(iconClass, 'cursor-pointer')} onClick={jumpBackward}>
          replay
        </IconBtn>
      </Tooltip>
      <IconBtn
        borderless
        size="custom"
        loading={isLoading}
        outlined={false}
        className={mergeClasses(
          'bg-accent text-primary hover:text-primary hover:not-disabled:text-primary cursor-pointer rounded-full',
          compact ? 'h-9 w-9 text-xl' : 'h-10 w-10 text-2xl'
        )}
        onClick={playPause}
      >
        {isPlaying ? 'pause' : 'play_arrow'}
      </IconBtn>
      <Tooltip text={jumpForwardTooltipText} position="top">
        <IconBtn borderless size="custom" className={mergeClasses(iconClass, 'cursor-pointer')} onClick={jumpForward}>
          forward_media
        </IconBtn>
      </Tooltip>
      <Tooltip text={nextButtonTooltipText} position="top">
        <IconBtn borderless size="custom" className={mergeClasses(iconClass, 'cursor-pointer')} disabled={!hasNext} onClick={handleNextChapter}>
          last_page
        </IconBtn>
      </Tooltip>
    </div>
  )
}
