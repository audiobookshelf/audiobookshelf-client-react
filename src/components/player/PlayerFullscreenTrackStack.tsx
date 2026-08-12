'use client'

import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import PlayerTrackBar from './PlayerTrackBar'

interface PlayerFullscreenTrackStackProps {
  playerHandler: PlayerHandler
}

/**
 * Fullscreen has vertical room the mini player does not, so when the user is on the chapter
 * track it shows the whole book as well — otherwise there is no way to see overall position.
 */
export default function PlayerFullscreenTrackStack({ playerHandler }: PlayerFullscreenTrackStackProps) {
  const { settings, chapters } = playerHandler.state

  if (!settings.useChapterTrack || chapters.length === 0) {
    return <PlayerTrackBar playerHandler={playerHandler} />
  }

  return (
    <>
      {/* Book first, chapter below it — the chapter bar sits closest to the transport controls */}
      <PlayerTrackBar playerHandler={playerHandler} scope="book" hideChapterTitle className="mb-2" />
      <PlayerTrackBar playerHandler={playerHandler} scope="chapter" />
    </>
  )
}
