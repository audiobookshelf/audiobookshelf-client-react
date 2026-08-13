'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { mergeClasses } from '@/lib/merge-classes'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerTransportControlsProps {
  controls: PlayerControlsState
  /**
   * `compact` is the mobile collapsed bar, `hero` is the fullscreen player — larger controls
   * are the main reason to go fullscreen, so it scales up rather than reusing the bar sizes.
   */
  size?: 'compact' | 'default' | 'hero'
  className?: string
}

/** Every target in `hero` clears the 44px minimum, since that layout is touch-first */
const SIZES = {
  compact: { jump: 'h-9 w-9 text-2xl', chapter: 'h-9 w-8 text-2xl', play: 'h-9 w-9 text-xl', gap: 'gap-2' },
  default: { jump: 'h-10 w-10 text-3xl', chapter: 'h-10 w-10 text-3xl', play: 'h-10 w-10 text-2xl', gap: 'gap-4' },
  hero: { jump: 'h-12 w-12 text-4xl', chapter: 'h-11 w-11 text-3xl', play: 'h-16 w-16 text-4xl', gap: 'gap-4 sm:gap-6' }
} as const

export default function PlayerTransportControls({ controls, size = 'default', className }: PlayerTransportControlsProps) {
  const {
    t,
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

  const sizes = SIZES[size]

  return (
    <div className={mergeClasses('flex items-center justify-center', sizes.gap, className)}>
      {/* Tooltip only sets aria-describedby, so each button still needs its own label —
          the icon glyph is aria-hidden inside IconBtn */}
      <Tooltip text={previousButtonTooltipText} position="top">
        <IconBtn
          borderless
          size="custom"
          className={mergeClasses(sizes.chapter, 'cursor-pointer')}
          onClick={handlePreviousChapter}
          ariaLabel={previousButtonTooltipText}
        >
          first_page
        </IconBtn>
      </Tooltip>
      <Tooltip text={jumpBackwardTooltipText} position="top">
        <IconBtn borderless size="custom" className={mergeClasses(sizes.jump, 'cursor-pointer')} onClick={jumpBackward} ariaLabel={jumpBackwardTooltipText}>
          replay
        </IconBtn>
      </Tooltip>
      <IconBtn
        borderless
        size="custom"
        loading={isLoading}
        outlined={false}
        className={mergeClasses('bg-accent text-primary hover:text-primary hover:not-disabled:text-primary cursor-pointer rounded-full', sizes.play)}
        onClick={playPause}
        ariaLabel={isPlaying ? t('ButtonPause') : t('ButtonPlay')}
      >
        {isPlaying ? 'pause' : 'play_arrow'}
      </IconBtn>
      <Tooltip text={jumpForwardTooltipText} position="top">
        <IconBtn borderless size="custom" className={mergeClasses(sizes.jump, 'cursor-pointer')} onClick={jumpForward} ariaLabel={jumpForwardTooltipText}>
          forward_media
        </IconBtn>
      </Tooltip>
      <Tooltip text={nextButtonTooltipText} position="top">
        <IconBtn
          borderless
          size="custom"
          className={mergeClasses(sizes.chapter, 'cursor-pointer')}
          disabled={!hasNext}
          onClick={handleNextChapter}
          ariaLabel={nextButtonTooltipText}
        >
          last_page
        </IconBtn>
      </Tooltip>
    </div>
  )
}
