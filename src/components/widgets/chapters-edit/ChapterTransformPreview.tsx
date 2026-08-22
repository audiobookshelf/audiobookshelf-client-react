'use client'

import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip, { TooltipCore } from '@/components/ui/Tooltip'
import { ShiftTimesFields } from '@/components/widgets/chapters-edit/ShiftTimesPanel'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getAudioTrackForTime, getChapterPreviewDirtyFields, type EditableChapter } from '@/lib/chapters/chapterEditorUtils'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { Fragment, useEffect, useMemo, type ReactNode } from 'react'

interface ChapterPreviewState {
  selectedChapterId: number | string | null
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  playChapter: (chapterId: number | string, start: number) => void
  destroyAudioEl: () => void
}

interface ChapterTransformPreviewProps {
  currentChapters: EditableChapter[]
  afterChapters: EditableChapter[]
  preview: ChapterPreviewState
  tracks: { startOffset: number; duration: number }[]
  applyDisabled?: boolean
  extraActions?: ReactNode
  getAfterRowAppearance?: (index: number, after: EditableChapter | undefined) => { className: string; tooltip?: string }
  previewShiftAmount?: number
  onPreviewShiftAmountChange?: (amount: number) => void
  onApply: () => void
}

function ChapterPreviewPlaySpacer() {
  return (
    <div className="flex shrink-0 items-center px-2" aria-hidden="true">
      <div className="w-9" />
      <div className="w-[3ch] font-mono text-xs" />
    </div>
  )
}

interface ChapterPreviewPlayControlsProps {
  canPlay: boolean
  isSelected: boolean
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  onPlay: () => void
}

function ChapterPreviewPlayControls({ canPlay, isSelected, isPlayingChapter, isLoadingChapter, elapsedTime, onPlay }: ChapterPreviewPlayControlsProps) {
  const t = useTypeSafeTranslations()
  const playLabel = isSelected && isPlayingChapter ? t('MessagePauseChapter') : t('MessagePlayChapter')

  return (
    <div className="flex shrink-0 items-center px-2">
      <Tooltip lazy text={playLabel} position="bottom">
        <IconBtn
          ariaLabel={playLabel}
          borderless
          size="small"
          loading={isSelected && isLoadingChapter}
          className="text-foreground-muted hover:not-disabled:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canPlay}
          onClick={onPlay}
        >
          {isSelected && isPlayingChapter ? 'pause' : 'play_arrow'}
        </IconBtn>
      </Tooltip>
      <span
        className={mergeClasses(
          'w-[3ch] shrink-0 text-center font-mono text-xs',
          isSelected && (isPlayingChapter || isLoadingChapter) ? 'text-foreground-muted' : 'invisible'
        )}
      >
        {elapsedTime}s
      </span>
    </div>
  )
}

interface ChapterPreviewSideRow {
  index: number
  chapter?: EditableChapter
  rowClass: string
  rowTooltip?: string
  startClass?: string
  titleClass?: string
  canPlay: boolean
  isSelected: boolean
  onPlay: () => void
}

interface ChapterPreviewSideTableProps {
  label: string
  rows: ChapterPreviewSideRow[]
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
}

function ChapterPreviewStartAndTitleCells({ row, cellClass }: { row: ChapterPreviewSideRow; cellClass: string }) {
  return (
    <>
      <div className={mergeClasses('px-3', cellClass)}>
        <p className={mergeClasses('font-mono whitespace-nowrap', row.startClass)}>{row.chapter ? secondsToTimestamp(row.chapter.start) : ''}</p>
      </div>
      <div className={mergeClasses('min-w-0 px-3', cellClass)}>
        <p className={mergeClasses('min-w-0 truncate', row.titleClass)}>{row.chapter?.title ?? ''}</p>
      </div>
    </>
  )
}

function ChapterPreviewSideTable({ label, rows, isPlayingChapter, isLoadingChapter, elapsedTime }: ChapterPreviewSideTableProps) {
  const t = useTypeSafeTranslations()
  const primaryInputCanHover = usePrimaryInputCanHover()

  return (
    <div className="grid w-full min-w-0 grid-cols-[max-content_minmax(0,1fr)_max-content]">
      <div className="text-foreground-muted col-span-3 px-3 pb-2 text-center text-sm font-semibold uppercase">{label}</div>
      <div className="text-foreground-muted px-3 text-xs font-semibold uppercase">{t('LabelStart')}</div>
      <div className="text-foreground-muted min-w-0 px-3 text-xs font-semibold uppercase">{t('LabelTitle')}</div>
      <ChapterPreviewPlaySpacer />

      {rows.map((row) => {
        const cellClass = mergeClasses('flex min-h-9 items-center py-0.5 text-xs', row.chapter && row.rowClass)
        const startAndTitle = <ChapterPreviewStartAndTitleCells row={row} cellClass={cellClass} />
        return (
          <Fragment key={row.index}>
            {row.rowTooltip ? (
              <TooltipCore
                lazy
                openOnClick={!primaryInputCanHover}
                activateOnFocus
                text={row.rowTooltip}
                position="top"
                maxWidth={280}
                className="col-span-2 grid min-h-9 min-w-0 cursor-help grid-cols-subgrid"
              >
                {startAndTitle}
              </TooltipCore>
            ) : (
              startAndTitle
            )}
            <div className={cellClass}>
              {row.chapter ? (
                <ChapterPreviewPlayControls
                  canPlay={row.canPlay}
                  isSelected={row.isSelected}
                  isPlayingChapter={isPlayingChapter}
                  isLoadingChapter={isLoadingChapter}
                  elapsedTime={elapsedTime}
                  onPlay={row.onPlay}
                />
              ) : (
                <ChapterPreviewPlaySpacer />
              )}
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

export default function ChapterTransformPreview({
  currentChapters,
  afterChapters,
  preview,
  tracks,
  applyDisabled = false,
  extraActions,
  getAfterRowAppearance,
  previewShiftAmount = 0,
  onPreviewShiftAmountChange,
  onApply
}: ChapterTransformPreviewProps) {
  const t = useTypeSafeTranslations()

  const comparisonRows = useMemo(() => {
    const rowCount = Math.max(currentChapters.length, afterChapters.length)
    return Array.from({ length: rowCount }, (_, index) => ({
      index,
      current: currentChapters[index],
      after: afterChapters[index]
    }))
  }, [afterChapters, currentChapters])

  const { destroyAudioEl, playChapter, selectedChapterId, isPlayingChapter, isLoadingChapter, elapsedTime } = preview
  const afterStartsKey = afterChapters.map((chapter) => `${chapter.id}:${chapter.start}`).join('|')

  useEffect(() => {
    return () => {
      destroyAudioEl()
    }
  }, [afterStartsKey, destroyAudioEl])

  const currentRows = comparisonRows.map(({ index, current }) => {
    const playId = current ? `current:${current.id}` : null
    return {
      index,
      chapter: current,
      rowClass: index % 2 === 0 ? 'bg-primary/30' : '',
      canPlay: current != null && !!getAudioTrackForTime(tracks, current.start),
      isSelected: playId != null && selectedChapterId === playId,
      onPlay: () => {
        if (current) playChapter(`current:${current.id}`, current.start)
      }
    }
  })

  const afterRows = comparisonRows.map(({ index, current, after }) => {
    const playId = after ? `after:${after.id}` : null
    const previewDirty = getChapterPreviewDirtyFields(current, after)
    const appearance = getAfterRowAppearance?.(index, after)
    return {
      index,
      chapter: after,
      rowClass: appearance?.className ?? (index % 2 === 0 ? 'bg-primary/30' : ''),
      rowTooltip: appearance?.tooltip,
      startClass: previewDirty.start ? 'text-info' : undefined,
      titleClass: previewDirty.title ? 'text-info' : undefined,
      canPlay: after != null && !!getAudioTrackForTime(tracks, after.start),
      isSelected: playId != null && selectedChapterId === playId,
      onPlay: () => {
        if (after) playChapter(`after:${after.id}`, after.start)
      }
    }
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <div className="h-full overflow-y-auto">
          <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-start gap-x-3">
            <ChapterPreviewSideTable
              label={t('LabelCurrent')}
              rows={currentRows}
              isPlayingChapter={isPlayingChapter}
              isLoadingChapter={isLoadingChapter}
              elapsedTime={elapsedTime}
            />
            <div />
            <ChapterPreviewSideTable
              label={t('LabelNew')}
              rows={afterRows}
              isPlayingChapter={isPlayingChapter}
              isLoadingChapter={isLoadingChapter}
              elapsedTime={elapsedTime}
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] gap-x-3">
          <div />
          <div className="flex items-center justify-center">
            <span className="material-symbols text-foreground-muted text-xl rtl:-scale-x-100" aria-hidden="true">
              arrow_forward
            </span>
          </div>
          <div />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-6 gap-y-2">
          {extraActions}
          {onPreviewShiftAmountChange && afterChapters.length > 1 ? (
            <ShiftTimesFields shiftAmount={previewShiftAmount} onShiftAmountChange={onPreviewShiftAmountChange} showHelp />
          ) : null}
        </div>
        <Btn size="small" color="bg-success" disabled={applyDisabled} onClick={onApply}>
          {t('ButtonApply')}
        </Btn>
      </div>
    </div>
  )
}
