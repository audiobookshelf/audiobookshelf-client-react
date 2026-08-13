'use client'

import { usePlayerPopoverOpen } from '@/lib/player/playerPopoverStore'
import { useEffect, useRef, useState } from 'react'
import PlayerFullscreenArtwork, { TITLE_BLOCK_RESERVE, useFittedCoverWidth, type JumpBurst } from './PlayerFullscreenArtwork'
import PlayerFullscreenTitle from './PlayerFullscreenTitle'
import PlayerFullscreenTrackStack from './PlayerFullscreenTrackStack'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTransportControls from './PlayerTransportControls'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerFullscreenDesktopLayoutProps {
  controls: PlayerControlsState
  metadata: PlayerMetadataDisplay
  coverSrc: string
  coverAspectRatio: number
  jumpBurst: JumpBurst | null
  onMinimize: () => void
}

const VOLUME_HUD_MS = 1400

function getVolumeIcon(volume: number): string {
  if (volume === 0) return 'volume_off'
  if (volume < 0.5) return 'volume_down'
  return 'volume_up'
}

export default function PlayerFullscreenDesktopLayout({
  controls,
  metadata,
  coverSrc,
  coverAspectRatio,
  jumpBurst,
  onMinimize
}: PlayerFullscreenDesktopLayoutProps) {
  const { playerHandler, streamLibraryItem } = controls
  const { volume } = playerHandler.state

  const stageRef = useRef<HTMLDivElement>(null)
  const coverWidth = useFittedCoverWidth(stageRef, coverAspectRatio, TITLE_BLOCK_RESERVE)

  // Volume changed by hotkey is otherwise invisible — the slider it came from is in a popover.
  // While that popover is open the slider is on screen, so the readout would only be a second
  // copy of what the user is already looking at.
  const isVolumePopoverOpen = usePlayerPopoverOpen('volume')
  const [isVolumeHudRequested, setIsVolumeHudRequested] = useState(false)
  const previousVolumeRef = useRef(volume)
  const volumeHudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (previousVolumeRef.current === volume) return
    previousVolumeRef.current = volume

    setIsVolumeHudRequested(true)
    if (volumeHudTimeoutRef.current) clearTimeout(volumeHudTimeoutRef.current)
    volumeHudTimeoutRef.current = setTimeout(() => setIsVolumeHudRequested(false), VOLUME_HUD_MS)
  }, [volume])

  useEffect(() => {
    return () => {
      if (volumeHudTimeoutRef.current) clearTimeout(volumeHudTimeoutRef.current)
    }
  }, [])

  const isVolumeHudVisible = isVolumeHudRequested && !isVolumePopoverOpen
  const volumePercent = Math.round(volume * 100)

  return (
    <>
      <div ref={stageRef} className="relative z-10 flex min-h-0 grow flex-col items-center justify-center gap-5 px-6 pt-16 pb-2">
        <PlayerFullscreenArtwork coverSrc={coverSrc} coverWidth={coverWidth} coverAspectRatio={coverAspectRatio} jumpBurst={jumpBurst}>
          {isVolumeHudVisible && (
            <div aria-hidden="true" className="player-volume-hud pointer-events-none absolute end-full top-1/2 z-30 -translate-y-1/2 pe-5">
              <div className="flex w-11 flex-col items-center gap-2 rounded-full bg-black/55 py-3 ring-1 ring-white/15 backdrop-blur-md">
                <span className="material-symbols text-xl leading-none">{getVolumeIcon(volume)}</span>
                <div className="bg-track-bg relative h-28 w-1.5 overflow-hidden rounded-full">
                  <div
                    className="player-volume-hud-fill bg-track-progress absolute start-0 bottom-0 w-full rounded-full"
                    style={{ height: `${volumePercent}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] font-semibold tabular-nums">{volumePercent}</span>
              </div>
            </div>
          )}
        </PlayerFullscreenArtwork>

        <PlayerFullscreenTitle streamLibraryItem={streamLibraryItem} metadata={metadata} onNavigate={onMinimize} />
      </div>

      <div className="bg-black-700 relative z-10 shrink-0 px-10 pt-3 pb-6">
        {/* One centered column: the secondary toolbar carries speed, sleep timer and the rest,
            so there is no second copy of those controls anywhere in the view */}
        <div className="mx-auto w-full max-w-[35rem]">
          <PlayerFullscreenTrackStack playerHandler={playerHandler} />
          <PlayerTransportControls controls={controls} size="hero" className="mt-3" />
          <PlayerSecondaryToolbar controls={controls} className="mt-3" />
        </div>
      </div>
    </>
  )
}
