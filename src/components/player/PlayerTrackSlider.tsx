'use client'

import type { PlayerTrackDisplay } from '@/components/player/playerTrackDisplay'
import type { PlayerTrackSeekController } from '@/components/player/usePlayerTrackSeek'
import { mergeClasses } from '@/lib/merge-classes'
import type { Chapter } from '@/types/api'

const PLAYER_TRACK_SLIDER_DUAL_CLASS = 'min-h-3 grow shrink-0 basis-auto'

interface PlayerTrackSliderProps {
  dual: boolean
  sliderLabel: string
  isLoading: boolean
  isHlsTranscode: boolean
  duration: number
  chapters: Chapter[]
  display: PlayerTrackDisplay
  seek: PlayerTrackSeekController
}

export default function PlayerTrackSlider({ dual, sliderLabel, isLoading, isHlsTranscode, duration, chapters, display, seek }: PlayerTrackSliderProps) {
  const { inChapterScope, effectiveDuration, playedTime, playedPercent, bufferedPercent, transcodeReadyPercent, currentTimeFormatted } = display
  const chapterTicks = !duration || seek.trackWidth === 0 || inChapterScope ? [] : chapters.map((chapter) => (chapter.start / duration) * seek.trackWidth)

  return (
    <div className={mergeClasses('player-track-slider-block relative', dual && PLAYER_TRACK_SLIDER_DUAL_CLASS)}>
      <div
        ref={seek.trackRef}
        role="slider"
        tabIndex={0}
        aria-label={sliderLabel}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, Math.round(effectiveDuration))}
        aria-valuenow={Math.max(0, Math.round(playedTime))}
        aria-valuetext={`${currentTimeFormatted} / ${Math.round(playedPercent)}%`}
        className="bg-track-bg relative h-2 w-full cursor-pointer overflow-hidden transition-transform duration-100 hover:scale-y-125"
        style={{ touchAction: 'none' }}
        onPointerDown={seek.handlePointerDown}
        onPointerMove={seek.handlePointerMove}
        onPointerUp={seek.endDrag}
        onPointerCancel={seek.cancelDrag}
        onPointerLeave={seek.handlePointerLeave}
        onKeyDown={seek.handleKeyDown}
      >
        {isHlsTranscode && (
          <div
            className="bg-track-progress/30 pointer-events-none absolute top-0 left-0 h-full transition-[width] duration-75"
            style={{ width: `${transcodeReadyPercent}%` }}
          />
        )}
        <div
          className="bg-track-progress/50 pointer-events-none absolute top-0 left-0 h-full transition-[width] duration-75"
          style={{ width: `${bufferedPercent}%` }}
        />
        <div
          className={mergeClasses(
            'bg-track-progress pointer-events-none absolute top-0 left-0 h-full',
            seek.dragPreviewTime == null && 'transition-[width] duration-75'
          )}
          style={{ width: `${playedPercent}%` }}
        />
        <div
          ref={seek.trackCursorRef}
          className={mergeClasses(
            'bg-track-progress pointer-events-none absolute top-0 left-0 h-full w-0.5 transition-opacity duration-100',
            seek.isHovering ? 'opacity-100' : 'opacity-0'
          )}
        />
        {isLoading && (
          <div className="via-track-progress/30 loading-track-slide pointer-events-none absolute top-0 h-full w-1/4 bg-linear-to-r from-transparent to-transparent" />
        )}
      </div>

      {/* Keep the tick row in layout so chapter and book slider blocks stay the same height. */}
      <div className="relative h-1 w-full overflow-hidden">
        {chapterTicks.map((left, index) => (
          <div key={index} className="bg-track-progress/30 pointer-events-none absolute top-0 h-1 w-px" style={{ left: `${left}px` }} />
        ))}
      </div>

      <div
        ref={seek.hoverTimestampRef}
        className={mergeClasses(
          'bg-foreground text-background pointer-events-none absolute -top-8 left-0 z-10 rounded-full transition-opacity duration-100',
          seek.isHovering ? 'opacity-100' : 'opacity-0'
        )}
      >
        <p ref={seek.hoverTimestampTextRef} className="truncate px-2 py-0.5 text-center font-mono text-xs whitespace-nowrap">
          00:00
        </p>
      </div>

      <div
        ref={seek.hoverTimestampArrowRef}
        className={mergeClasses(
          'bg-foreground text-background pointer-events-none absolute -top-3.5 left-0 rounded-full transition-opacity duration-100',
          seek.isHovering ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="absolute right-0 -bottom-1.5 left-0 flex w-full justify-center">
          <div className="border-t-foreground h-0 w-0 border-t-4 border-r-4 border-l-4 border-r-transparent border-l-transparent" />
        </div>
      </div>
    </div>
  )
}
