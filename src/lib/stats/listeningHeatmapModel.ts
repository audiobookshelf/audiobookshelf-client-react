import { addDays, format, startOfDay } from 'date-fns'

export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4

export const HEATMAP_INTENSITY_LEVELS: HeatmapIntensity[] = [0, 1, 2, 3, 4]

export const HEATMAP_BLOCK_PX = 13
export const HEATMAP_INNER_ROWS = 7
export const HEATMAP_INNER_HEIGHT = HEATMAP_BLOCK_PX * HEATMAP_INNER_ROWS

export interface HeatmapMonthLabelModel {
  id: string
  label: string
  col: number
}

export interface HeatmapCellModel {
  col: number
  row: number
  dateString: string
  datePretty: string
  monthString: string
  dayOfMonth: number
  value: number
  intensity: HeatmapIntensity
}

export function computeWeeksToShow(contentWidthPx: number): number {
  const maxInnerWidth = contentWidthPx - 52
  return Math.max(0, Math.min(52, Math.floor(maxInnerWidth / HEATMAP_BLOCK_PX) - 1))
}

export function computeInnerWidthPx(weeksToShow: number): number {
  return (weeksToShow + 1) * HEATMAP_BLOCK_PX
}

export function buildListeningHeatmapModel(
  daysListening: Record<string, number>,
  weeksToShow: number
): { cells: HeatmapCellModel[]; daysListenedInTheLastYear: number; monthLabels: HeatmapMonthLabelModel[] } {
  const dayOfWeekToday = new Date().getDay()
  const numDaysInTheLastYear = 52 * 7 + dayOfWeekToday
  const daysToShow = weeksToShow * 7 + dayOfWeekToday

  const today = startOfDay(new Date())
  const firstDay = addDays(today, -numDaysInTheLastYear)

  let daysListenedInTheLastYear = 0

  type AggRow = {
    visibleDayIndex: number
    dateString: string
    datePretty: string
    monthString: string
    dayOfMonth: number
    value: number
  }

  const agg: AggRow[] = []
  let maxValue = 0
  let minValue = 0

  for (let i = 0; i < numDaysInTheLastYear + 1; i++) {
    const date = addDays(firstDay, i)
    const dateString = format(date, 'yyyy-MM-dd')

    if ((daysListening[dateString] ?? 0) > 0) {
      daysListenedInTheLastYear++
    }

    const visibleDayIndex = i - (numDaysInTheLastYear - daysToShow)
    if (visibleDayIndex < 0) continue

    const value = daysListening[dateString] ?? 0
    const datePretty = format(date, 'MMM d, yyyy')
    const monthString = format(date, 'MMM')
    const dayOfMonth = Number(dateString.split('-')[2])

    agg.push({ visibleDayIndex, dateString, datePretty, monthString, dayOfMonth, value })

    if (value > 0) {
      if (value > maxValue) maxValue = value
      if (!minValue || value < minValue) minValue = value
    }
  }

  const range = maxValue - minValue + 0.01

  const cells: HeatmapCellModel[] = agg.map((d) => {
    const col = Math.floor(d.visibleDayIndex / 7)
    const row = d.visibleDayIndex % 7
    let intensity: HeatmapIntensity = 0
    if (d.value) {
      const percentOfAvg = (d.value - minValue) / range
      const idx = Math.floor(percentOfAvg * 4) + 1
      intensity = Math.min(4, Math.max(1, idx)) as HeatmapIntensity
    }
    return {
      col,
      row,
      dateString: d.dateString,
      datePretty: d.datePretty,
      monthString: d.monthString,
      dayOfMonth: d.dayOfMonth,
      value: d.value,
      intensity
    }
  })

  const monthLabels: HeatmapMonthLabelModel[] = []
  let lastMonth: string | null = null
  for (const cell of cells) {
    if (cell.monthString !== lastMonth) {
      const weekOfMonth = Math.floor(cell.dayOfMonth / 7)
      if (weekOfMonth <= 2) {
        monthLabels.push({
          id: `${cell.dateString}-ml`,
          label: cell.monthString,
          col: cell.col
        })
        lastMonth = cell.monthString
      }
    }
  }

  return { cells, daysListenedInTheLastYear, monthLabels }
}
