'use client'

import Checkbox from '@/components/ui/Checkbox'
import DurationPicker from '@/components/ui/DurationPicker'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { ChapterMatchDebug, EditableChapter } from '@/lib/chapters/chapterEditorUtils'
import { secondsToHmsTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

interface ChapterTitleInputProps {
  title: string
  /** Saved title for dirty comparison. Omit for unsaved rows (always dirty). */
  baselineTitle?: string
  onDraft: (title: string) => void
  onCommit: (title: string) => void
}

const ChapterTitleInput = memo(function ChapterTitleInput({ title, baselineTitle, onDraft, onCommit }: ChapterTitleInputProps) {
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
  startDirty?: boolean
  baselineTitle?: string
  isChecked: boolean
  isPlaySelected: boolean
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  canPlay: boolean
  overflow?: 'start' | 'end' | null
  showMatchDebug?: boolean
  matchDebug?: ChapterMatchDebug | null
  onCheckedChange: (checked: boolean) => void
  onStartChange: (start: number) => void
  onTitleDraft: (title: string) => void
  onTitleCommit: (title: string) => void
  onRemove: () => void
  onInsertBelow: () => void
  onPlay: () => void
  onAdjustStartTime: () => void
}

const MATCH_DEBUG_CLASS = 'text-foreground-muted text-[9px] leading-none ps-3'
const MATCH_DEBUG_PREFIX = 'was: '
const MATCH_DEBUG_NONE = '—'

function ChapterEditTableRow({
  chapter,
  chapterCount,
  mediaDuration,
  startDirty = false,
  baselineTitle,
  isChecked,
  isPlaySelected,
  isPlayingChapter,
  isLoadingChapter,
  elapsedTime,
  canPlay,
  overflow = null,
  showMatchDebug = false,
  matchDebug = null,
  onCheckedChange,
  onStartChange,
  onTitleDraft,
  onTitleCommit,
  onRemove,
  onInsertBelow,
  onPlay,
  onAdjustStartTime
}: ChapterEditTableRowProps) {
  const t = useTypeSafeTranslations()
  const overflowTooltip = overflow === 'start' ? t('MessageChapterStartIsAfter') : overflow === 'end' ? t('MessageChapterEndIsAfter') : undefined
  const startTimeCellClass =
    mediaDuration >= 360000 ? 'w-[8.75rem] min-w-[8.75rem] px-2 py-2 align-middle' : 'w-[7.25rem] min-w-[7.25rem] px-2 py-2 align-middle'

  return (
    <tr
      title={overflowTooltip}
      className={mergeClasses(
        'border-border hover:bg-table-row-bg-hover border-b',
        overflow === 'start' ? 'bg-error/20' : overflow === 'end' ? 'bg-warning/20' : 'even:bg-table-row-bg-even'
      )}
    >
      <td className="w-10 min-w-10 px-2 py-2 text-center align-middle">
        <div className="flex items-center justify-center">
          <Checkbox value={isChecked} size="small" ariaLabel={chapter.title.trim() || t('LabelTitle')} onChange={onCheckedChange} />
        </div>
      </td>

      <td className={startTimeCellClass}>
        <div className="flex flex-col gap-0.5">
          <DurationPicker
            value={chapter.start}
            showThreeDigitHour={mediaDuration >= 360000}
            size="small"
            className={startDirty ? 'text-info' : undefined}
            onChange={onStartChange}
          />
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

      <td className="min-w-0 px-2 py-2 align-middle">
        <div className="flex min-w-0 flex-col gap-0.5">
          <ChapterTitleInput title={chapter.title} baselineTitle={baselineTitle} onDraft={onTitleDraft} onCommit={onTitleCommit} />
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

      <td className="w-52 min-w-52 px-2 py-2 align-middle">
        <div className="flex shrink-0 items-center">
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

          <div className="ms-2 min-w-10 shrink-0 text-center">
            {chapter.error ? (
              <Tooltip lazy text={chapter.error} position="left" maxWidth={300}>
                <span className="material-symbols text-error text-lg" aria-label={chapter.error}>
                  error_outline
                </span>
              </Tooltip>
            ) : (
              isPlaySelected &&
              (isPlayingChapter || isLoadingChapter) && (
                <Tooltip lazy text={t('TooltipAdjustChapterStart')} position="bottom">
                  <button
                    type="button"
                    className="text-foreground-muted hover:text-foreground cursor-pointer font-mono text-xs transition-colors"
                    onClick={onAdjustStartTime}
                  >
                    {elapsedTime}s
                  </button>
                </Tooltip>
              )
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

export default memo(ChapterEditTableRow)
