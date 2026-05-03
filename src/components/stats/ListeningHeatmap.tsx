'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatDuration } from '@/lib/formatDuration'
import {
  HEATMAP_BLOCK_PX,
  HEATMAP_INNER_HEIGHT,
  HEATMAP_INTENSITY_LEVELS,
  buildListeningHeatmapModel,
  computeInnerWidthPx,
  computeWeeksToShow,
  type HeatmapCellModel
} from '@/lib/stats/listeningHeatmapModel'
import { format } from 'date-fns'
import type { ReactNode } from 'react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ListeningHeatmapProps {
  daysListening: Record<string, number>
}

export default function ListeningHeatmap({ daysListening }: ListeningHeatmapProps) {
  const t = useTypeSafeTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const [contentWidth, setContentWidth] = useState<number | null>(null)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const [tooltipContent, setTooltipContent] = useState<ReactNode>(null)
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null)

  const heatmapLayout = useMemo(() => {
    if (contentWidth == null || contentWidth <= 0) return null
    const weeksToShow = computeWeeksToShow(contentWidth)
    const innerWidth = computeInnerWidthPx(weeksToShow)
    const model = buildListeningHeatmapModel(daysListening, weeksToShow)
    return { innerWidth, ...model }
  }, [contentWidth, daysListening])

  const dayLabels = useMemo(
    () => [
      {
        label: format(new Date(2023, 0, 2), 'EEE'),
        style: { transform: `translate(${-25}px, ${HEATMAP_BLOCK_PX}px)`, lineHeight: '10px', fontSize: '10px' }
      },
      {
        label: format(new Date(2023, 0, 4), 'EEE'),
        style: { transform: `translate(${-25}px, ${HEATMAP_BLOCK_PX * 3}px)`, lineHeight: '10px', fontSize: '10px' }
      },
      {
        label: format(new Date(2023, 0, 6), 'EEE'),
        style: { transform: `translate(${-25}px, ${HEATMAP_BLOCK_PX * 5}px)`, lineHeight: '10px', fontSize: '10px' }
      }
    ],
    []
  )

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const w = containerRef.current?.clientWidth ?? 0
      if (w > 0) setContentWidth(w)
    }
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w > 0) setContentWidth(w)
    })
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (!anchor || tooltipContent == null || !tooltipRef.current) {
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
    const top = anchor.top - th - 6
    setTooltipPos({ left, top })
  }, [anchor, tooltipContent])

  const hideTooltip = () => {
    setAnchor(null)
    setTooltipContent(null)
    setTooltipPos(null)
  }

  const openTooltip = (cell: HeatmapCellModel, rect: DOMRect) => {
    const durationStr = formatDuration(cell.value, t, { style: 'long', showSeconds: cell.value < 60 })
    const content = cell.value
      ? t.rich('MessageHeatmapListeningTimeTooltip', {
          0: durationStr,
          1: cell.datePretty,
          strong: (chunks) => <strong>{chunks}</strong>
        })
      : t('MessageHeatmapNoListeningSessions', { 0: cell.datePretty })
    setTooltipPos(null)
    setAnchor(rect)
    setTooltipContent(content)
  }

  const ariaLabelForCell = (cell: HeatmapCellModel) => {
    if (cell.value > 0) {
      return `${formatDuration(cell.value, t, { style: 'long', showSeconds: cell.value < 60 })}, ${cell.datePretty}`
    }
    return t('MessageHeatmapNoListeningSessions', { 0: cell.datePretty })
  }

  const showPortal = Boolean(heatmapLayout && anchor && tooltipContent != null)

  return (
    <div ref={containerRef} className="w-full">
      {!heatmapLayout ? (
        // placeholder until the width is known
        <div className="w-full" style={{ minHeight: HEATMAP_INNER_HEIGHT + 160 }} aria-busy="true" />
      ) : (
        <>
          <div
            className="mx-auto"
            style={{
              height: HEATMAP_INNER_HEIGHT + 160,
              width: heatmapLayout.innerWidth + 52
            }}
          >
            <p className="text-foreground-muted mb-2 px-1 text-sm">{t('MessageDaysListenedInTheLastYear', { 0: heatmapLayout.daysListenedInTheLastYear })}</p>
            <div className="border-border bg-heatmap-bg relative w-full rounded-sm border py-2" style={{ height: HEATMAP_INNER_HEIGHT + 80 }}>
              <div className="absolute mt-5 ml-10" style={{ width: heatmapLayout.innerWidth, height: HEATMAP_INNER_HEIGHT }} onMouseLeave={hideTooltip}>
                {dayLabels.map((d) => (
                  <div key={d.label} style={{ ...d.style }} className="text-foreground-muted absolute top-0 left-0">
                    {d.label}
                  </div>
                ))}

                {heatmapLayout.monthLabels.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      transform: `translate(${m.col * HEATMAP_BLOCK_PX}px, -15px)`,
                      lineHeight: '10px',
                      fontSize: '10px'
                    }}
                    className="text-foreground-muted absolute top-0 left-0"
                  >
                    {m.label}
                  </div>
                ))}

                {heatmapLayout.cells.map((cell) => (
                  <button
                    key={cell.dateString}
                    type="button"
                    aria-label={ariaLabelForCell(cell)}
                    data-intensity={cell.intensity}
                    style={{
                      transform: `translate(${cell.col * HEATMAP_BLOCK_PX}px, ${cell.row * HEATMAP_BLOCK_PX}px)`
                    }}
                    className="listening-heatmap-cell"
                    onMouseEnter={(e) => openTooltip(cell, e.currentTarget.getBoundingClientRect())}
                    onFocus={(e) => openTooltip(cell, e.currentTarget.getBoundingClientRect())}
                    onBlur={hideTooltip}
                  />
                ))}

                <div className="flex px-4 py-2" style={{ marginTop: HEATMAP_INNER_HEIGHT }}>
                  <div className="grow" />
                  <p style={{ fontSize: '10px', lineHeight: '10px' }} className="text-foreground-muted px-1">
                    {t('LabelLess')}
                  </p>
                  {HEATMAP_INTENSITY_LEVELS.map((level) => (
                    <div key={level} data-intensity={level} className="listening-heatmap-swatch mx-[1.5px] h-2.5 w-2.5 shrink-0 rounded-xs" aria-hidden />
                  ))}
                  <p style={{ fontSize: '10px', lineHeight: '10px' }} className="text-foreground-muted px-1">
                    {t('LabelMore')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {showPortal &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                ref={tooltipRef}
                id="heatmap-tooltip"
                role="tooltip"
                className="bg-bg-read-only text-foreground pointer-events-none fixed z-[1000] max-w-xs rounded-sm p-2 text-[10px] leading-[10px]"
                style={{
                  left: tooltipPos?.left ?? -9999,
                  top: tooltipPos?.top ?? 0,
                  visibility: tooltipPos ? 'visible' : 'hidden'
                }}
              >
                {tooltipContent}
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  )
}
