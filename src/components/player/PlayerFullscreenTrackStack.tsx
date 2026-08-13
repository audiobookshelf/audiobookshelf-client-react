'use client'

import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import PlayerTrackBar from './PlayerTrackBar'

interface PlayerFullscreenTrackStackProps {
  playerHandler: PlayerHandler
}

/**
 * Fullscreen has vertical room the mini player does not, so when the user is on the chapter
 * track it shows the whole book as well — otherwise there is no way to see overall position.
 */
export default function PlayerFullscreenTrackStack({ playerHandler }: PlayerFullscreenTrackStackProps) {
  const t = useTypeSafeTranslations()
  const { settings, chapters } = playerHandler.state

  if (!settings.useChapterTrack || chapters.length === 0) {
    return <PlayerTrackBar playerHandler={playerHandler} />
  }

  return (
    <>
      {/* Book first, chapter below it — the chapter bar sits closest to the transport controls.
          Each carries its own label, so the two sliders are told apart without sight of them. */}
      <PlayerTrackBar playerHandler={playerHandler} scope="book" hideChapterTitle ariaLabel={t('LabelPlaybackPositionInBook')} className="mb-2" />
      <PlayerTrackBar playerHandler={playerHandler} scope="chapter" ariaLabel={t('LabelPlaybackPositionInChapter')} />
    </>
  )
}
