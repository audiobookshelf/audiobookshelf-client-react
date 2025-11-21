import type { MediaProgress } from '@/types/api'

export interface ProgressComputationOptions {
  progress: MediaProgress | null | undefined
  /**
   * Optional pre-computed series progress in the 0–1 range
   */
  seriesProgressPercent?: number
  /**
   * When true and seriesProgressPercent is provided, that value is used
   * instead of the individual item progress.
   */
  useSeriesProgress?: boolean
}

export interface ProgressComputationResult {
  percent: number
  isFinished: boolean
  lastUpdated: number | null
  startedAt: number | null
  finishedAt: number | null
}

export function computeProgress({
  progress,
  seriesProgressPercent,
  useSeriesProgress
}: ProgressComputationOptions): ProgressComputationResult {
  if (useSeriesProgress && typeof seriesProgressPercent === 'number') {
    const clampedSeries = clamp01(seriesProgressPercent)
    return {
      percent: clampedSeries,
      isFinished: clampedSeries >= 1,
      lastUpdated: progress?.lastUpdate ?? null,
      startedAt: progress?.startedAt ?? null,
      finishedAt: progress?.finishedAt ?? null
    }
  }

  if (!progress) {
    return {
      percent: 0,
      isFinished: false,
      lastUpdated: null,
      startedAt: null,
      finishedAt: null
    }
  }

  const useEbookProgress = !progress.progress && progress.ebookProgress > 0
  const rawPercent = progress.isFinished ? 1 : useEbookProgress ? progress.ebookProgress || 0 : progress.progress || 0
  const percent = clamp01(rawPercent)

  return {
    percent,
    isFinished: !!progress.isFinished,
    lastUpdated: progress.lastUpdate ?? null,
    startedAt: progress.startedAt ?? null,
    finishedAt: progress.finishedAt ?? null
  }
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(1, value))
}


