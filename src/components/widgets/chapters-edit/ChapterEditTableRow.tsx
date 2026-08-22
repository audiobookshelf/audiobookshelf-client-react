'use client'

import DurationPicker from '@/components/ui/DurationPicker'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EditableChapter } from '@/lib/chapters/chapterEditorUtils'
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
  showSecondInputs: boolean
  startDirty?: boolean
  baselineTitle?: string
  isSelected: boolean
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  canPlay: boolean
  onStartChange: (start: number) => void
  onTitleDraft: (title: string) => void
  onTitleCommit: (title: string) => void
  onIncrementTime: (amount: number) => void
  onRemove: () => void
  onInsertBelow: () => void
  onPlay: () => void
  onAdjustStartTime: () => void
}

const TIME_INCREMENT = 1

function ChapterEditTableRow({
  chapter,
  chapterCount,
  mediaDuration,
  showSecondInputs,
  startDirty = false,
  baselineTitle,
  isSelected,
  isPlayingChapter,
  isLoadingChapter,
  elapsedTime,
  canPlay,
  onStartChange,
  onTitleDraft,
  onTitleCommit,
  onIncrementTime,
  onRemove,
  onInsertBelow,
  onPlay,
  onAdjustStartTime
}: ChapterEditTableRowProps) {
  const t = useTypeSafeTranslations()
  const cannotDecrement = chapter.id === 0 && chapter.start - TIME_INCREMENT < 0
  const cannotIncrement = chapter.start + TIME_INCREMENT >= mediaDuration

  return (
    <tr className="border-border even:bg-table-row-bg-even hover:bg-table-row-bg-hover border-b">
      <td className="w-[9.5rem] min-w-[9.5rem] px-2 py-2 align-middle md:w-40 md:min-w-40">
        <div className="flex w-full items-center gap-1">
          <Tooltip lazy text={t('TooltipSubtractOneSecond')} position="bottom">
            <button
              type="button"
              aria-label={t('TooltipSubtractOneSecond')}
              className={mergeClasses(
                'text-foreground-muted hover:text-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110',
                cannotDecrement && 'cursor-not-allowed opacity-50'
              )}
              disabled={cannotDecrement}
              onClick={() => onIncrementTime(-TIME_INCREMENT)}
            >
              <span className="material-symbols text-sm">remove</span>
            </button>
          </Tooltip>

          <div className="min-w-0 flex-1">
            {showSecondInputs ? (
              <TextInput
                type="number"
                value={String(chapter.start)}
                size="small"
                className="text-xs"
                customInputClass={startDirty ? 'text-info' : undefined}
                onChange={(value) => onStartChange(Number(value))}
              />
            ) : (
              <DurationPicker
                value={chapter.start}
                showThreeDigitHour={mediaDuration >= 360000}
                size="small"
                className={mergeClasses('w-full', startDirty && 'text-info')}
                onChange={onStartChange}
              />
            )}
          </div>

          <Tooltip lazy text={t('TooltipAddOneSecond')} position="bottom">
            <button
              type="button"
              aria-label={t('TooltipAddOneSecond')}
              className={mergeClasses(
                'text-foreground-muted hover:text-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110',
                cannotIncrement && 'cursor-not-allowed opacity-50'
              )}
              disabled={cannotIncrement}
              onClick={() => onIncrementTime(TIME_INCREMENT)}
            >
              <span className="material-symbols text-sm">add</span>
            </button>
          </Tooltip>
        </div>
      </td>

      <td className="min-w-0 px-2 py-2 align-middle">
        <ChapterTitleInput title={chapter.title} baselineTitle={baselineTitle} onDraft={onTitleDraft} onCommit={onTitleCommit} />
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

          <Tooltip lazy text={isSelected && isPlayingChapter ? t('MessagePauseChapter') : t('MessagePlayChapter')} position="bottom">
            <IconBtn
              ariaLabel={isSelected && isPlayingChapter ? t('MessagePauseChapter') : t('MessagePlayChapter')}
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

          <div className="ms-2 min-w-10 shrink-0 text-center">
            {chapter.error ? (
              <Tooltip lazy text={chapter.error} position="left" maxWidth={300}>
                <span className="material-symbols text-error text-lg" aria-label={chapter.error}>
                  error_outline
                </span>
              </Tooltip>
            ) : (
              isSelected &&
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
