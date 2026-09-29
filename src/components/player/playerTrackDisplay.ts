import { secondsToTimestamp } from '@/lib/datefns'
import type { Chapter } from '@/types/api'

export type PlayerTrackScope = 'auto' | 'book' | 'chapter'

export function getPlayerTrackScope(
  scope: PlayerTrackScope,
  useChapterTrack: boolean,
  chapters: Chapter[],
  currentTime: number,
  duration: number,
  playbackRate: number
) {
  const currentChapter = chapters.find((chapter) => chapter.start <= currentTime && chapter.end > currentTime) ?? null
  const currentChapterDuration = currentChapter ? currentChapter.end - currentChapter.start : 0
  const currentChapterStart = currentChapter ? currentChapter.start : 0
  const preferChapterScope = scope === 'chapter' || (scope === 'auto' && useChapterTrack)
  const inChapterScope = preferChapterScope && currentChapterDuration > 0
  const effectivePlaybackRate = playbackRate && !isNaN(playbackRate) ? playbackRate : 1
  const effectiveDuration = inChapterScope ? currentChapterDuration : duration
  const currentChapterNumber = currentChapter ? chapters.findIndex((chapter) => chapter.id === currentChapter.id) + 1 : null

  return {
    currentChapter,
    currentChapterNumber,
    currentChapterStart,
    currentChapterDuration,
    inChapterScope,
    effectiveDuration,
    effectivePlaybackRate
  }
}

export function getPlayerTrackDisplay(
  scope: PlayerTrackScope,
  useChapterTrack: boolean,
  chapters: Chapter[],
  currentTime: number,
  duration: number,
  playbackRate: number,
  bufferedTime: number,
  dragPreviewTime: number | null,
  transcodePercentReady: number,
  isHlsTranscode: boolean
) {
  const scopeState = getPlayerTrackScope(scope, useChapterTrack, chapters, currentTime, duration, playbackRate)
  const { inChapterScope, currentChapterStart, currentChapterDuration, effectiveDuration, effectivePlaybackRate } = scopeState
  const displayTime = dragPreviewTime ?? currentTime

  const timeRemainingToShow = (inChapterScope ? currentChapterDuration - (displayTime - currentChapterStart) : duration - displayTime) / effectivePlaybackRate
  const timeRemainingFormatted = timeRemainingToShow < 0 ? secondsToTimestamp(timeRemainingToShow * -1) : `-${secondsToTimestamp(timeRemainingToShow)}`

  const playedTime = inChapterScope ? Math.max(0, displayTime - currentChapterStart) : displayTime
  const playedPercent = effectiveDuration ? Math.min(100, (playedTime / effectiveDuration) * 100) : 0

  const bufferedTimeAdjusted = inChapterScope ? Math.max(0, bufferedTime - currentChapterStart) : bufferedTime
  const bufferedPercent = effectiveDuration ? Math.min(100, (bufferedTimeAdjusted / effectiveDuration) * 100) : 0
  const transcodeReadyPercent = isHlsTranscode ? Math.min(100, transcodePercentReady * 100) : 0

  return {
    ...scopeState,
    playedTime,
    playedPercent,
    bufferedPercent,
    transcodeReadyPercent,
    currentTimeFormatted: secondsToTimestamp(playedTime / effectivePlaybackRate),
    timeRemainingFormatted
  }
}
