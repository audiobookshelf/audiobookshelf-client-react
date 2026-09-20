'use client'

import { TooltipCore } from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { formatChapterSegmentLabel, type ChapterSegment as ChapterSegmentData } from '@/lib/player/getChapterMarkers'
import { useCallback, useMemo } from 'react'

interface ChapterSegmentProps {
  segment: ChapterSegmentData
  isActive: boolean
  isHovered?: boolean
  disabled?: boolean
  onSeek: (time: number) => void
}

export default function ChapterSegment({ segment, isActive, isHovered = false, disabled = false, onSeek }: ChapterSegmentProps) {
  const t = useTypeSafeTranslations()
  const label = useMemo(
    () => formatChapterSegmentLabel(segment.number, segment.title, t('LabelChapterNumber', { 0: segment.number })),
    [segment.number, segment.title, t]
  )
  const timestamp = secondsToTimestamp(segment.start)

  const handleActivate = useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (disabled) return
      onSeek(segment.start)
    },
    [disabled, onSeek, segment.start]
  )

  return (
    <div
      cy-id="chapter-segment"
      data-chapter-number={segment.number}
      data-chapter-start={segment.start}
      data-active={isActive ? 'true' : 'false'}
      aria-current={isActive ? 'true' : undefined}
      className="group/segment pointer-events-none absolute top-0 bottom-0"
      style={{ left: `${segment.startRatio * 100}%`, width: `${segment.widthRatio * 100}%` }}
    >
      <span
        cy-id="chapter-segment-highlight"
        aria-hidden
        className={mergeClasses(
          'pointer-events-none absolute inset-x-0 top-1.5 bottom-1.5 transition-colors duration-100',
          isActive && 'bg-foreground/15',
          isHovered && 'bg-foreground/25',
          'group-hover/segment:bg-foreground/25 group-focus-within/segment:bg-foreground/30'
        )}
      />
      <TooltipCore
        text={
          <>
            <span className="block">{label}</span>
            <span className="font-mono">{timestamp}</span>
          </>
        }
        position="top"
        lazy
        activateOnFocus
        className="pointer-events-auto absolute top-1/2 left-0 z-[2] h-4 w-4 -translate-x-1/2 -translate-y-1/2"
      >
        <button
          type="button"
          cy-id={segment.showBoundary ? 'chapter-boundary' : 'chapter-start'}
          data-chapter-number={segment.number}
          data-chapter-start={segment.start}
          aria-label={label}
          disabled={disabled}
          onClick={handleActivate}
          className={mergeClasses(
            'flex h-full w-full items-center justify-center rounded-full focus-visible:outline-none',
            segment.showBoundary ? 'cursor-pointer' : undefined
          )}
        >
          {segment.showBoundary ? <span aria-hidden className="bg-primary ring-track-progress h-1.5 w-1.5 rounded-full ring-1" /> : label}
        </button>
      </TooltipCore>
    </div>
  )
}
