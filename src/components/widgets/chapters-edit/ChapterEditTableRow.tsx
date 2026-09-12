'use client'

import Checkbox from '@/components/ui/Checkbox'
import DurationPicker from '@/components/ui/DurationPicker'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import Indicator from '@/components/widgets/Indicator'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { ChapterMatchDebug, EditableChapter } from '@/lib/chapters/chapterEditorUtils'
import { secondsToHmsTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

interface ChapterTitleInputProps {
  title: string
  /** Saved title for dirty comparison. Omit for unsaved rows (always dirty). */
  baselineTitle?: string
  ariaLabelledBy?: string
  onDraft: (title: string) => void
  onCommit: (title: string) => void
}

const ChapterTitleInput = memo(function ChapterTitleInput({ title, baselineTitle, ariaLabelledBy, onDraft, onCommit }: ChapterTitleInputProps) {
  const [localTitle, setLocalTitle] = useState(title)
  const localTitleRef = useRef(title)
  const isEditingRef = useRef(false)
  const isDirty = baselineTitle === undefined || localTitle.trim() !== baselineTitle

  useEffect(() => {
    if (!isEditingRef.current) {
      setLocalTitle(title)
      localTitleRef.current = title
    }
  }, [title])

  const handleChange = useCallback(
    (value: string) => {
      localTitleRef.current = value
      setLocalTitle(value)
      onDraft(value)
    },
    [onDraft]
  )

  const handleFocus = useCallback(() => {
    isEditingRef.current = true
  }, [])

  const handleBlur = useCallback(() => {
    isEditingRef.current = false
    const trimmedTitle = localTitleRef.current.trim()
    localTitleRef.current = trimmedTitle
    setLocalTitle(trimmedTitle)
    onCommit(trimmedTitle)
  }, [onCommit])

  return (
    <TextInput
      value={localTitle}
      size="small"
      className="w-full min-w-0 text-sm"
      customInputClass={isDirty ? 'text-info' : undefined}
      ariaLabelledBy={ariaLabelledBy}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
})

export interface ChapterEditTableRowProps {
  chapter: EditableChapter
  chapterCount: number
  mediaDuration: number
  isFirstChapter?: boolean
  startDirty?: boolean
  baselineTitle?: string
  isChecked: boolean
  isEvenRow?: boolean
  isPlaySelected: boolean
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  canPlay: boolean
  overflow?: 'start' | 'end' | null
  showMatchDebug?: boolean
  matchDebug?: ChapterMatchDebug | null
  startHeaderId: string
  titleHeaderId: string
  titleResetKey?: number
  onCheckedChange: (checked: boolean) => void
  onStartChange: (start: number) => void
  onTitleDraft: (title: string) => void
  onTitleCommit: (title: string) => void
  onRemove: () => void
  onInsertBelow: () => void
  onPlay: () => void
}

/** Shown when `SHOW_CHAPTER_MATCH_DEBUG` is true (`src/lib/chapters/chapterMatching.ts`). */
const MATCH_DEBUG_CLASS = 'text-foreground-muted text-[9px] leading-none ps-3'
const MATCH_DEBUG_PREFIX = 'was: '
const MATCH_DEBUG_NONE = '—'

const TIME_INCREMENT = 1
const START_STEP_BTN_CLASS =
  'h-9 w-7 shrink-0 p-0 shadow-none text-sm text-foreground-muted hover:not-disabled:text-foreground disabled:border disabled:border-solid disabled:border-border'
const START_STEP_MINUS_CLASS = mergeClasses(START_STEP_BTN_CLASS, 'rounded-e-none')
const START_STEP_PLUS_CLASS = mergeClasses(START_STEP_BTN_CLASS, 'rounded-s-none')

function ChapterEditTableRow({
  chapter,
  chapterCount,
  mediaDuration,
  isFirstChapter = false,
  startDirty = false,
  baselineTitle,
  isChecked,
  isEvenRow = false,
  isPlaySelected,
  isPlayingChapter,
  isLoadingChapter,
  elapsedTime,
  canPlay,
  overflow = null,
  showMatchDebug = false,
  matchDebug = null,
  startHeaderId,
  titleHeaderId,
  titleResetKey = 0,
  onCheckedChange,
  onStartChange,
  onTitleDraft,
  onTitleCommit,
  onRemove,
  onInsertBelow,
  onPlay
}: ChapterEditTableRowProps) {
  const t = useTypeSafeTranslations()
  const overflowTooltip = overflow === 'start' ? t('MessageChapterStartIsAfter') : overflow === 'end' ? t('MessageChapterEndIsAfter') : undefined
  const startTimeCellClass =
    mediaDuration >= 360000
      ? 'w-[11rem] min-w-[11rem] px-1 py-2 align-top md:w-[12.25rem] md:min-w-[12.25rem] md:px-2'
      : 'w-[10rem] min-w-[10rem] px-1 py-2 align-top md:w-[10.75rem] md:min-w-[10.75rem] md:px-2'
  const cannotDecrementStart = isFirstChapter || chapter.start - TIME_INCREMENT < 0
  const cannotIncrementStart = isFirstChapter || chapter.start + TIME_INCREMENT >= mediaDuration
  const rowBgClass = overflow === 'start' ? 'bg-error/20' : overflow === 'end' ? 'bg-warning/20' : isEvenRow ? 'bg-table-row-bg-even' : undefined
  const rowClass = mergeClasses('border-border hover:bg-table-row-bg-hover', rowBgClass)

  const actions = (
    <div className="flex max-w-full flex-nowrap items-center">
      {chapterCount > 1 && (
        <Tooltip lazy text={t('MessageRemoveChapter')} position="bottom">
          <IconBtn
            ariaLabel={t('MessageRemoveChapter')}
            borderless
            size="small"
            className="text-foreground-muted hover:not-disabled:text-error"
            onClick={onRemove}
          >
            delete
          </IconBtn>
        </Tooltip>
      )}

      <Tooltip lazy text={t('MessageInsertChapterBelow')} position="bottom">
        <IconBtn
          ariaLabel={t('MessageInsertChapterBelow')}
          borderless
          size="small"
          className="text-foreground-muted hover:not-disabled:text-success"
          onClick={onInsertBelow}
        >
          add_row_below
        </IconBtn>
      </Tooltip>

      <Tooltip lazy text={isPlaySelected && isPlayingChapter ? t('MessagePauseChapter') : t('MessagePlayChapter')} position="bottom">
        <IconBtn
          ariaLabel={isPlaySelected && isPlayingChapter ? t('MessagePauseChapter') : t('MessagePlayChapter')}
          borderless
          size="small"
          loading={isPlaySelected && isLoadingChapter}
          className="text-foreground-muted hover:not-disabled:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canPlay}
          onClick={onPlay}
        >
          {isPlaySelected && isPlayingChapter ? 'pause' : 'play_arrow'}
        </IconBtn>
      </Tooltip>

      <div className="flex min-w-[4ch] shrink-0 items-center justify-end px-1">
        {chapter.error ? (
          <span className="inline-flex h-9 items-center justify-center">
            <Indicator tooltipText={chapter.error} position="left" className="text-error text-lg" ariaLabel={chapter.error}>
              error_outline
            </Indicator>
          </span>
        ) : (
          isPlaySelected &&
          (isPlayingChapter || isLoadingChapter) && <span className="text-foreground-muted font-mono text-xs whitespace-nowrap">{elapsedTime}s</span>
        )}
      </div>
    </div>
  )

  return (
    <tr title={overflowTooltip} className={mergeClasses(rowClass, 'border-b max-md:grid max-md:grid-cols-[3rem_minmax(0,1fr)_auto] max-md:items-start')}>
      <td className="w-12 min-w-12 py-2 ps-3 pe-2 text-center align-top max-md:col-start-1 max-md:row-start-1 max-md:flex max-md:items-center max-md:justify-center">
        <div className="flex items-center justify-center">
          <Checkbox value={isChecked} size="small" ariaLabel={chapter.title.trim() || t('LabelTitle')} onChange={onCheckedChange} />
        </div>
      </td>

      <td className={mergeClasses(startTimeCellClass, 'max-md:col-start-2 max-md:row-start-1 max-md:block max-md:w-auto max-md:min-w-0')}>
        <div className="flex flex-col gap-0.5">
          <div className="flex w-fit items-stretch">
            <Tooltip lazy className="relative z-1 -me-px flex h-9 shrink-0" text={t('TooltipSubtractOneSecond')} position="bottom">
              <IconBtn
                ariaLabel={t('TooltipSubtractOneSecond')}
                size="custom"
                className={START_STEP_MINUS_CLASS}
                disabled={cannotDecrementStart}
                onClick={() => onStartChange(Math.max(0, chapter.start - TIME_INCREMENT))}
              >
                remove
              </IconBtn>
            </Tooltip>

            <div className="relative focus-within:z-2">
              <DurationPicker
                value={chapter.start}
                showThreeDigitHour={mediaDuration >= 360000}
                size="small"
                className={startDirty ? 'text-info' : undefined}
                wrapperClassName="rounded-none"
                ariaLabelledBy={startHeaderId}
                disabled={isFirstChapter}
                onChange={onStartChange}
              />
            </div>

            <Tooltip lazy className="relative z-1 -ms-px flex h-9 shrink-0" text={t('TooltipAddOneSecond')} position="bottom">
              <IconBtn
                ariaLabel={t('TooltipAddOneSecond')}
                size="custom"
                className={START_STEP_PLUS_CLASS}
                disabled={cannotIncrementStart}
                onClick={() => onStartChange(chapter.start + TIME_INCREMENT)}
              >
                add
              </IconBtn>
            </Tooltip>
          </div>
          {showMatchDebug ? (
            matchDebug ? (
              <Tooltip
                lazy
                text={`${MATCH_DEBUG_PREFIX}${secondsToHmsTimestamp(matchDebug.oldStart)} (match cost: ${matchDebug.matchCost.toFixed(3)})`}
                position="bottom"
              >
                <span className={mergeClasses(MATCH_DEBUG_CLASS, 'font-mono')}>
                  {MATCH_DEBUG_PREFIX}
                  {secondsToHmsTimestamp(matchDebug.oldStart)}
                </span>
              </Tooltip>
            ) : (
              <span className={MATCH_DEBUG_CLASS}>
                {MATCH_DEBUG_PREFIX}
                {MATCH_DEBUG_NONE}
              </span>
            )
          ) : null}
        </div>
      </td>

      <td className="min-w-0 px-1 py-2 align-top max-md:col-span-2 max-md:col-start-1 max-md:row-start-2 max-md:block max-md:min-w-0 max-md:pt-0 md:px-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <ChapterTitleInput
            key={`${chapter.clientKey ?? chapter.id}-${titleResetKey}`}
            title={chapter.title}
            baselineTitle={baselineTitle}
            ariaLabelledBy={titleHeaderId}
            onDraft={onTitleDraft}
            onCommit={onTitleCommit}
          />
          {showMatchDebug ? (
            matchDebug ? (
              <Tooltip
                lazy
                text={`${MATCH_DEBUG_PREFIX}${matchDebug.oldTitle || MATCH_DEBUG_NONE} (match cost: ${matchDebug.matchCost.toFixed(3)})`}
                position="bottom"
              >
                <span className={mergeClasses(MATCH_DEBUG_CLASS, 'flex min-w-0 items-baseline gap-1')}>
                  <span className="min-w-0 truncate">
                    {MATCH_DEBUG_PREFIX}
                    {matchDebug.oldTitle || MATCH_DEBUG_NONE}
                  </span>
                  <span className="shrink-0 font-mono">({matchDebug.matchCost.toFixed(3)})</span>
                </span>
              </Tooltip>
            ) : (
              <span className={mergeClasses(MATCH_DEBUG_CLASS, 'block min-w-0 truncate')}>
                {MATCH_DEBUG_PREFIX}
                {MATCH_DEBUG_NONE}
              </span>
            )
          ) : null}
        </div>
      </td>

      <td className="w-40 min-w-40 px-2 py-2 align-top max-md:col-start-3 max-md:row-start-2 max-md:flex max-md:w-auto max-md:min-w-0 max-md:items-center max-md:pt-0 md:table-cell">
        {actions}
      </td>
    </tr>
  )
}

export default ChapterEditTableRow
