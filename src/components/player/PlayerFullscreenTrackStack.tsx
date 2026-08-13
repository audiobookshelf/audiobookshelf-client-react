'use client'

import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import PlayerTrackBar from './PlayerTrackBar'

interface PlayerFullscreenTrackStackProps {
  playerHandler: PlayerHandler
  /**
   * The desktop ring already spans the whole book, so the bar below it covers the chapter
   * instead of repeating what the artwork is showing.
   */
  preferChapterScope?: boolean
}

/**
 * Fullscreen has vertical room the mini player does not, so when the user is on the chapter
 * track it can show the whole book as well — otherwise there is no way to see overall
 * position. "Show both tracks" turns that off for anyone who wants the chapter alone.
 */
export default function PlayerFullscreenTrackStack({ playerHandler, preferChapterScope = false }: PlayerFullscreenTrackStackProps) {
  const t = useTypeSafeTranslations()
  const { settings, chapters } = playerHandler.state

  const isChapterScoped = (settings.useChapterTrack || preferChapterScope) && chapters.length > 0

  if (!isChapterScoped) {
    return <PlayerTrackBar playerHandler={playerHandler} rounded layout="flanking" />
  }

  // The ring is the book track, so stacking a second one under it is the duplication the
  // scope switch exists to avoid
  if (!settings.showBookTrackWithChapterTrack || preferChapterScope) {
    return <PlayerTrackBar playerHandler={playerHandler} scope="chapter" rounded layout="flanking" ariaLabel={t('LabelPlaybackPositionInChapter')} />
  }

  return (
    <>
      {/* Book first, chapter below it — the chapter bar sits closest to the transport controls.
          Each carries its own label, so the two sliders are told apart without sight of them.
          Only the chapter bar prints the chapter header; twice would be noise. */}
      <PlayerTrackBar
        playerHandler={playerHandler}
        scope="book"
        hideChapterTitle
        rounded
        layout="flanking"
        ariaLabel={t('LabelPlaybackPositionInBook')}
        className="mb-2"
      />
      <PlayerTrackBar playerHandler={playerHandler} scope="chapter" rounded layout="flanking" ariaLabel={t('LabelPlaybackPositionInChapter')} />
    </>
  )
}
