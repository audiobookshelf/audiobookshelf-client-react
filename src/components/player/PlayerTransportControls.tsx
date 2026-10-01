'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { mergeClasses } from '@/lib/merge-classes'
import { layoutClass, playerShellVariant, type LayoutClasses } from './playerShellClasses'
import type { PlayerControlsState } from './usePlayerControlsState'

const TRANSPORT_ROW: LayoutClasses = {
  root: 'flex items-center justify-center',
  mini: 'gap-1',
  fullscreen: 'gap-4',
  landscape: 'gap-4'
}
const TRANSPORT_ROW_MINI_DESKTOP = 'gap-2'

const JUMP: LayoutClasses = {
  root: 'player-jump-btn cursor-pointer',
  mini: 'h-11 min-h-11 w-11 min-w-11 text-2xl',
  fullscreen: 'h-12 min-h-12 w-12 min-w-12 text-3xl',
  landscape: 'h-12 min-h-12 w-12 min-w-12 text-3xl'
}
const JUMP_MINI_DESKTOP = 'h-10 min-h-10 w-10 min-w-10 text-3xl'

const PLAY: LayoutClasses = {
  root: 'player-play-btn bg-accent text-primary hover:text-primary hover:not-disabled:text-primary cursor-pointer rounded-full',
  mini: 'h-11 min-h-11 w-11 min-w-11 text-xl',
  fullscreen: 'h-(--fs-transport) min-h-(--fs-transport) w-(--fs-transport) min-w-(--fs-transport) text-4xl',
  landscape: 'h-(--fs-transport) min-h-(--fs-transport) w-(--fs-transport) min-w-(--fs-transport) text-4xl'
}
const PLAY_MINI_DESKTOP = 'h-10 w-10 text-2xl'

const CHAPTER_SLOT: LayoutClasses = {
  root: 'flex min-w-0 w-0 overflow-hidden opacity-0 invisible pointer-events-none',
  mini: 'lg:w-auto lg:overflow-visible lg:opacity-100 lg:visible lg:pointer-events-auto',
  fullscreen: 'w-auto overflow-visible opacity-100 visible pointer-events-auto',
  landscape: 'w-auto overflow-visible opacity-100 visible pointer-events-auto'
}

const TRANSPORT_TOOLTIP: LayoutClasses = {
  mini: 'items-center justify-center leading-none',
  fullscreen: 'items-center justify-center leading-none',
  landscape: 'items-center justify-center leading-none'
}

interface PlayerTransportControlsProps {
  controls: PlayerControlsState
  /** Mobile mini bar: jump back, play, and jump forward beside the title row. */
  variant?: 'mini' | 'full'
}

export default function PlayerTransportControls({ controls, variant = 'full' }: PlayerTransportControlsProps) {
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()
  const layout = playerShellVariant(isPlayerFullscreen, isLandscapeCompact)
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

  const isCompactTransport = variant === 'mini'
  const miniDesktopOnShell = layout === 'mini' && !isCompactTransport
  const jumpClass = mergeClasses(layoutClass(JUMP, layout), miniDesktopOnShell && JUMP_MINI_DESKTOP)
  const playClass = mergeClasses(layoutClass(PLAY, layout), miniDesktopOnShell && PLAY_MINI_DESKTOP)
  const tooltipClass = isCompactTransport || layout !== 'mini' ? layoutClass(TRANSPORT_TOOLTIP, layout) : undefined

  const chapterSlotClassName = mergeClasses('player-chapter-slot', layoutClass(CHAPTER_SLOT, layout))

  const renderChapterSlot = (tooltipText: string, icon: string, onClick: () => void, disabled?: boolean) => (
    <div className={chapterSlotClassName}>
      <Tooltip text={tooltipText} position="top" className={tooltipClass}>
        <IconBtn borderless size="custom" className={jumpClass} disabled={disabled} onClick={onClick}>
          {icon}
        </IconBtn>
      </Tooltip>
    </div>
  )

  const renderJumpButton = (tooltipText: string, icon: string, onClick: () => void, transitionClass: string) => (
    <Tooltip text={tooltipText} position="top" className={tooltipClass}>
      <IconBtn borderless size="custom" className={mergeClasses(jumpClass, transitionClass)} onClick={onClick}>
        {icon}
      </IconBtn>
    </Tooltip>
  )

  return (
    <div className={mergeClasses('player-transport', layoutClass(TRANSPORT_ROW, layout), miniDesktopOnShell && TRANSPORT_ROW_MINI_DESKTOP)}>
      {!isCompactTransport && renderChapterSlot(previousButtonTooltipText, 'first_page', handlePreviousChapter)}
      {renderJumpButton(jumpBackwardTooltipText, 'replay', jumpBackward, 'player-transport-jump-back')}
      <IconBtn borderless size="custom" loading={isLoading} outlined={false} className={playClass} onClick={playPause}>
        {isPlaying ? 'pause' : 'play_arrow'}
      </IconBtn>
      {renderJumpButton(jumpForwardTooltipText, 'forward_media', jumpForward, 'player-transport-jump-forward')}
      {!isCompactTransport && renderChapterSlot(nextButtonTooltipText, 'last_page', handleNextChapter, !hasNext)}
    </div>
  )
}
