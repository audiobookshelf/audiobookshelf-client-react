'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import {
  DAILY_CHART_MARGIN_LEFT,
  DAILY_CHART_MERGE_DEMO_DATA,
  DAILY_CHART_VIEWBOX_HEIGHT,
  DAILY_CHART_WIDTH,
  DAILY_CHART_X_LABEL_Y,
  buildDailyListeningChartModel,
  buildDemoListeningDaysForChartWindow
} from '@/lib/stats/dailyListeningChartModel'
import { useLocale } from 'next-intl'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface DailyListeningChartProps {
  daysListening: Record<string, number>
}

export default function DailyListeningChart({ daysListening }: DailyListeningChartProps) {
  const t = useTypeSafeTranslations()
  const locale = useLocale()
  const tooltipRef = useRef<HTMLDivElement>(null)

  const model = useMemo(() => {
    const now = new Date()
    const days = DAILY_CHART_MERGE_DEMO_DATA ? { ...daysListening, ...buildDemoListeningDaysForChartWindow(now, {}) } : daysListening
    return buildDailyListeningChartModel(days, now)
  }, [daysListening])

  const fmt = useMemo(() => {
    const nf = new Intl.NumberFormat(locale)
    return (n: number) => nf.format(n)
  }, [locale])
  const { lineSpacing, yTickValues, series, pointCentersSvg, polylinePointsSvg } = model

  const summaryLabel = useMemo(() => {
    const parts = series.map((d) => `${d.weekdayAbbr} ${d.minutes}m`)
    return parts.join(', ')
  }, [series])

  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const [tooltipText, setTooltipText] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    if (!anchor || tooltipText == null || !tooltipRef.current) {
      setTooltipPos(null)
      return
    }
    const el = tooltipRef.current
    const tw = el.offsetWidth
    const th = el.offsetHeight
    let left = anchor.left + anchor.width / 2 - tw / 2
    if (left < 10) {
      left = 10
    } else if (left + tw > window.innerWidth - 10) {
      left = window.innerWidth - 10 - tw
    }
    const top = anchor.top - th
    setTooltipPos({ left, top })
  }, [anchor, tooltipText])

  const hideTooltip = () => {
    setAnchor(null)
    setTooltipText(null)
    setTooltipPos(null)
  }

  const showDotTooltip = (minutes: number, rect: DOMRect) => {
    setTooltipPos(null)
    setAnchor(rect)
    setTooltipText(String(minutes))
  }

  const showPortal = Boolean(anchor && tooltipText != null)

  return (
    <div className="mx-auto w-96 max-w-full">
      <h2 className="mb-4 text-2xl">{t('HeaderStatsMinutesListeningChart')}</h2>

      <div className="relative flex w-full">
        <div className="flex w-6 shrink-0 flex-col">
          {yTickValues.map((tick) => (
            <div key={tick} style={{ height: `${lineSpacing}px` }} className="flex items-center justify-end text-xs font-semibold">
              {fmt(tick)}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <svg
            role="img"
            aria-label={summaryLabel}
            viewBox={`0 0 ${DAILY_CHART_WIDTH} ${DAILY_CHART_VIEWBOX_HEIGHT}`}
            className="h-[18rem] w-full max-w-[22.5rem]"
            preserveAspectRatio="xMidYMid meet"
          >
            {Array.from({ length: 7 }, (_, n) => {
              const y = (n + 1) * lineSpacing - lineSpacing / 2
              return <line key={n} x1={DAILY_CHART_MARGIN_LEFT} x2={DAILY_CHART_WIDTH} y1={y} y2={y} stroke="var(--color-border)" strokeWidth={1} />
            })}

            <polyline
              fill="none"
              className="text-yellow-400"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePointsSvg}
              pointerEvents="none"
            />

            {series.map((d, i) => (
              <text
                key={`xlab-${d.dateKey}`}
                x={pointCentersSvg[i]?.x ?? 0}
                y={DAILY_CHART_X_LABEL_Y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-foreground pointer-events-none fill-current text-sm"
              >
                {d.weekdayAbbr}
              </text>
            ))}

            {pointCentersSvg.map((c, i) => {
              const minutes = series[i]?.minutes ?? 0
              const label = `${series[i]?.weekdayAbbr ?? ''} ${minutes} minutes`
              return (
                <g
                  key={series[i]?.dateKey ?? i}
                  transform={`translate(${c.x},${c.y})`}
                  className="group cursor-default"
                  aria-label={label}
                  onMouseEnter={(e) => showDotTooltip(minutes, e.currentTarget.getBoundingClientRect())}
                  onMouseLeave={hideTooltip}
                  onFocus={(e) => showDotTooltip(minutes, e.currentTarget.getBoundingClientRect())}
                  onBlur={hideTooltip}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') hideTooltip()
                  }}
                  tabIndex={0}
                >
                  <circle r={14} cx={0} cy={0} className="fill-transparent" />
                  <g
                    className="transition-transform duration-150 ease-out group-hover:scale-125"
                    style={{ transformBox: 'fill-box', transformOrigin: '0px 0px' }}
                  >
                    <circle r={4} cx={0} cy={0} className="pointer-events-none fill-yellow-400 transition-colors duration-150 group-hover:fill-yellow-300" />
                  </g>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-4 pt-12">
        <div className="text-center">
          <p className="text-sm">{t('LabelStatsWeekListening')}</p>
          <p className="text-5xl leading-[0.85] font-semibold">{fmt(model.totalMinutes)}</p>
          <p className="text-sm">{t('LabelStatsMinutes')}</p>
        </div>
        <div className="text-center">
          <p className="text-sm">{t('LabelStatsDailyAverage')}</p>
          <p className="text-5xl leading-[0.85] font-semibold">{fmt(model.averageMinutes)}</p>
          <p className="text-sm">{t('LabelStatsMinutes')}</p>
        </div>
        <div className="text-center">
          <p className="text-sm">{t('LabelStatsBestDay')}</p>
          <p className="text-5xl leading-[0.85] font-semibold">{fmt(model.bestDayMinutes)}</p>
          <p className="text-sm">{t('LabelStatsMinutes')}</p>
        </div>
        <div className="text-center">
          <p className="text-sm">{t('LabelStatsDays')}</p>
          <p className="text-5xl leading-[0.85] font-semibold">{fmt(model.streakDays)}</p>
          <p className="text-sm">{t('LabelStatsInARow')}</p>
        </div>
      </div>

      {showPortal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className="bg-bg-read-only text-foreground pointer-events-none fixed z-[1000] max-w-xs rounded-sm px-2 py-1 text-xs leading-snug whitespace-nowrap shadow-lg"
            style={{
              left: tooltipPos?.left ?? -9999,
              top: tooltipPos?.top ?? 0,
              visibility: tooltipPos ? 'visible' : 'hidden'
            }}
          >
            {tooltipText}
          </div>,
          document.body
        )}
    </div>
  )
}
