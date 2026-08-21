'use client'

import { useRef } from 'react'
import PlayerFullscreenArtwork, { TITLE_BLOCK_RESERVE, useFittedCoverWidth, type JumpBurst } from './PlayerFullscreenArtwork'
import PlayerFullscreenTitle from './PlayerFullscreenTitle'
import PlayerFullscreenTouchControls from './PlayerFullscreenTouchControls'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerFullscreenTouchLayoutProps {
  controls: PlayerControlsState
  metadata: PlayerMetadataDisplay
  coverSrc: string
  coverAspectRatio: number
  jumpBurst: JumpBurst | null
  onMinimize: () => void
  isShortLandscape: boolean
}

/**
 * Touch fullscreen for portrait and landscape. Only the outer arrangement changes — artwork
 * stacked over a bottom bar in portrait, side-by-side in short landscape — while title,
 * transport and the secondary toolbar always come from the same components and sizes.
 */
export default function PlayerFullscreenTouchLayout({
  controls,
  metadata,
  coverSrc,
  coverAspectRatio,
  jumpBurst,
  onMinimize,
  isShortLandscape
}: PlayerFullscreenTouchLayoutProps) {
  const { streamLibraryItem } = controls

  const stageRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const belowReserve = isShortLandscape ? 32 : TITLE_BLOCK_RESERVE
  const coverWidth = useFittedCoverWidth(
    stageRef,
    coverAspectRatio,
    belowReserve,
    isShortLandscape ? { lateralReserveRef: controlsRef, horizontalInset: 32 } : undefined
  )

  const title = <PlayerFullscreenTitle streamLibraryItem={streamLibraryItem} metadata={metadata} onNavigate={onMinimize} />

  const artwork = <PlayerFullscreenArtwork coverSrc={coverSrc} coverWidth={coverWidth} coverAspectRatio={coverAspectRatio} jumpBurst={jumpBurst} />

  if (isShortLandscape) {
    return (
      <div ref={stageRef} className="player-fullscreen-pane relative z-10 flex min-h-0 grow items-center justify-evenly overflow-hidden pt-10 pb-4">
        <div className="px-4">{artwork}</div>

        <div ref={controlsRef} className="flex shrink-0 flex-col justify-center gap-2 overflow-hidden overscroll-none px-4">
          <PlayerFullscreenTouchControls controls={controls} narrowTrackToTransport titleSlot={title} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        ref={stageRef}
        className="player-fullscreen-pane relative z-10 flex min-h-0 grow flex-col items-center justify-center gap-5 overflow-hidden px-5 pt-16 pb-2"
      >
        {artwork}
        <div className="w-full min-w-0">{title}</div>
      </div>

      {/* Inset on the bar itself, not the overlay root, so its background still reaches the
          bottom edge of the screen rather than leaving a strip of backdrop below it */}
      <div
        className="player-fullscreen-pane relative z-10 shrink-0 bg-black px-4 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <PlayerFullscreenTouchControls controls={controls} />
      </div>
    </>
  )
}
