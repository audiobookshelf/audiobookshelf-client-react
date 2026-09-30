'use client'

import PlayerMarqueeText from '@/components/player/PlayerMarqueeText'
import PlayerTrackSlider from '@/components/player/PlayerTrackSlider'
import { getPlayerTrackDisplay, getPlayerTrackScope, type PlayerTrackScope } from '@/components/player/playerTrackDisplay'
import { usePlayerTrackSeek } from '@/components/player/usePlayerTrackSeek'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { usePlayerProgress } from '@/lib/player/playerProgressStore'
import { PlayerState } from '@/types/api'

const PLAYER_TRACK_CORE_DUAL_CLASS = 'flex min-h-8 flex-col'
const PLAYER_TRACK_TIMESTAMPS_DUAL_CLASS = 'min-h-5 flex-none'

interface PlayerTrackBarProps {
  playerHandler: PlayerHandler
  scope?: PlayerTrackScope
  /** Fullscreen mobile: chapter title above the slider for a wider marquee. */
  chapterLabelPlacement?: 'below' | 'above'
  /** Mini player: wait for horizontal movement before seeking so vertical shell swipes win. */
  deferTouchSeekToShellGestures?: boolean
  /** Fullscreen chapter + book tracks: match timestamp row height. Tick space is always in the slider block. */
  dual?: boolean
}

export default function PlayerTrackBar({
  playerHandler,
  scope = 'auto',
  chapterLabelPlacement = 'below',
  deferTouchSeekToShellGestures = false,
  dual = false
}: PlayerTrackBarProps) {
  const t = useTypeSafeTranslations()
  const { isLandscapeCompact } = usePlayerShellLayout()
  const { duration, settings, chapters, playerState, transcodePercentReady, isHlsTranscode } = playerHandler.state
  const { seek } = playerHandler.controls
  const { playbackRate, useChapterTrack } = settings
  const { currentTime, bufferedTime } = usePlayerProgress()

  const isLoading = playerState === PlayerState.LOADING
  const trackScope = getPlayerTrackScope(scope, useChapterTrack, chapters, currentTime, duration, playbackRate)
  const seekControls = usePlayerTrackSeek({
    trackScope,
    chapters,
    currentTime,
    duration,
    isLoading,
    seek,
    deferTouchSeekToShellGestures
  })
  const display = getPlayerTrackDisplay(trackScope, duration, currentTime, bufferedTime, seekControls.dragPreviewTime, transcodePercentReady, isHlsTranscode)

  const sliderLabel = display.inChapterScope ? t('AriaLabelChapterProgress') : t('AriaLabelBookProgress')
  const showChapterLabel = display.currentChapter != null && scope !== 'book'
  const chapterLabel =
    showChapterLabel && display.currentChapter ? (
      <div className="player-track-chapter-label text-foreground-muted flex min-w-0 items-center gap-1">
        <div className="min-w-0 flex-1">
          <PlayerMarqueeText text={display.currentChapter.title} />
        </div>
        {chapters.length > 0 && display.currentChapterNumber !== null && (
          <span className="text-foreground-subdued shrink-0 tabular-nums">
            {t('LabelPlayerChapterNumberMarker', { 0: display.currentChapterNumber, 1: chapters.length })}
          </span>
        )}
      </div>
    ) : null

  return (
    <div className="player-track-bar">
      {showChapterLabel && chapterLabelPlacement === 'above' && (
        <div className={mergeClasses('player-track-chapter-header mb-1 text-center', isLandscapeCompact && 'text-start')}>{chapterLabel}</div>
      )}
      <div className={mergeClasses('player-track-core', dual && PLAYER_TRACK_CORE_DUAL_CLASS)}>
        <PlayerTrackSlider
          dual={dual}
          sliderLabel={sliderLabel}
          isLoading={isLoading}
          isHlsTranscode={isHlsTranscode}
          duration={duration}
          chapters={chapters}
          display={display}
          seek={seekControls}
        />
        <div className={mergeClasses('player-track-timestamps flex items-center justify-between gap-3', dual && PLAYER_TRACK_TIMESTAMPS_DUAL_CLASS)}>
          <p className="text-foreground-muted shrink-0 font-mono">
            {display.currentTimeFormatted}
            {' / '}
            {Math.round(display.playedPercent)}%
          </p>
          {chapterLabelPlacement === 'below' && chapterLabel ? (
            <div className="flex min-w-0 flex-1 items-center justify-center sm:max-w-none">{chapterLabel}</div>
          ) : (
            <span className="flex-1" />
          )}
          <p className="text-foreground-muted shrink-0 font-mono">{display.timeRemainingFormatted}</p>
        </div>
      </div>
    </div>
  )
}
