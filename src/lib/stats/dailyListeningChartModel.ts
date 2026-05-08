import { addDays, format, startOfDay } from 'date-fns'

/** Set true to layer fake per-day seconds for the current 7-day chart window (local testing) */
export const DAILY_CHART_MERGE_DEMO_DATA = false

/** Demo values in seconds for each chart day, oldest to today */
const DEMO_SECONDS_OLDEST_TO_TODAY = [120 * 60, 180 * 60, 45 * 60, 90 * 60, 200 * 60, 240 * 60, 150 * 60]

/** when testing overwrite the base data with demo data for the current 7-day window */
export function buildDemoListeningDaysForChartWindow(now: Date, base: Record<string, number> = {}): Record<string, number> {
  const today = startOfDay(now)
  const out = { ...base }
  DEMO_SECONDS_OLDEST_TO_TODAY.forEach((sec, index) => {
    const d = addDays(today, index - 6)
    out[format(d, 'yyyy-MM-dd')] = sec
  })
  return out
}

export const DAILY_CHART_WIDTH = 384
export const DAILY_CHART_HEIGHT = 288
/** Total chart SVG height including x axis labels */
export const DAILY_CHART_VIEWBOX_HEIGHT = DAILY_CHART_HEIGHT + 22
/** Y position of the x axis labels */
export const DAILY_CHART_X_LABEL_Y = DAILY_CHART_HEIGHT + 14
export const DAILY_CHART_CONTENT_WIDTH = 360
export const DAILY_CHART_MARGIN_LEFT = DAILY_CHART_WIDTH - DAILY_CHART_CONTENT_WIDTH
export const DAILY_CHART_MARGIN_BOTTOM = DAILY_CHART_HEIGHT - 268

export interface DailyChartDayPoint {
  dateKey: string
  weekdayAbbr: string
  minutes: number
}

export interface DailyChartModel {
  series: DailyChartDayPoint[]
  yAxisStep: number
  yMaxMinutes: number
  /** Tick values from top to bottom */
  yTickValues: number[]
  lineSpacing: number
  /** Circle centers for line/dots in SVG coords */
  pointCentersSvg: { x: number; y: number }[]
  polylinePointsSvg: string
  totalMinutes: number
  averageMinutes: number
  bestDayMinutes: number
  streakDays: number
}

function minutesForDay(daysSeconds: Record<string, number>, dateKey: string): number {
  return Math.round((daysSeconds[dateKey] ?? 0) / 60)
}

function computeYAxisStep(mostListenedDay: number): number {
  let factor = Math.ceil(mostListenedDay / 5)
  if (factor > 25) {
    factor = Math.ceil(factor / 5) * 5
  }
  return Math.max(1, factor)
}

/**
 * Consecutive calendar days with any listening, walking backward in the chart window only
 * If today has no listening time yet, it does not break the streak. Counting starts from yesterday
 */
function computeStreakInChartWindow(series: DailyChartDayPoint[], daysSeconds: Record<string, number>): number {
  let i = series.length - 1

  if (i >= 0) {
    const todaySec = daysSeconds[series[i].dateKey] ?? 0
    if (!todaySec || todaySec === 0) {
      i--
    }
  }

  let streak = 0
  for (; i >= 0; i--) {
    const sec = daysSeconds[series[i].dateKey] ?? 0
    if (!sec || sec === 0) break
    streak++
  }
  return streak
}

export function buildDailyListeningChartModel(daysSeconds: Record<string, number>, now: Date): DailyChartModel {
  const today = startOfDay(now)
  const series: DailyChartDayPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, i * -1)
    const dateKey = format(d, 'yyyy-MM-dd')
    series.push({
      dateKey,
      weekdayAbbr: format(d, 'EEE'),
      minutes: minutesForDay(daysSeconds, dateKey)
    })
  }

  const bestDayMinutes = [...series].sort((a, b) => b.minutes - a.minutes)[0]?.minutes ?? 0
  const yAxisStep = computeYAxisStep(bestDayMinutes)
  const yMaxMinutes = yAxisStep * 7

  const yTickValues: number[] = []
  for (let i = 6; i >= 0; i--) {
    yTickValues.push(i * yAxisStep)
  }

  const lineSpacing = DAILY_CHART_HEIGHT / 7
  const daySpacing = DAILY_CHART_CONTENT_WIDTH / 7

  const pointCentersSvg: { x: number; y: number }[] = []
  for (let i = 0; i < 7; i++) {
    const minutes = series[i]?.minutes ?? 0
    const yPercent = minutes / yMaxMinutes
    const xLegacy = 4 + DAILY_CHART_MARGIN_LEFT + (daySpacing + daySpacing / 14) * i
    const yBottom = DAILY_CHART_MARGIN_BOTTOM + DAILY_CHART_HEIGHT * yPercent - 2
    const centerX = xLegacy + 4
    const centerY = DAILY_CHART_HEIGHT - yBottom - 4
    pointCentersSvg.push({ x: centerX, y: centerY })
  }

  const polylinePointsSvg = pointCentersSvg.map((p) => `${p.x},${p.y}`).join(' ')

  let totalMinutes = 0
  for (const p of series) {
    totalMinutes += p.minutes
  }
  const averageMinutes = Math.round(totalMinutes / 7)
  const streakDays = computeStreakInChartWindow(series, daysSeconds)

  return {
    series,
    yAxisStep,
    yMaxMinutes,
    yTickValues,
    lineSpacing,
    pointCentersSvg,
    polylinePointsSvg,
    totalMinutes,
    averageMinutes,
    bestDayMinutes,
    streakDays
  }
}
