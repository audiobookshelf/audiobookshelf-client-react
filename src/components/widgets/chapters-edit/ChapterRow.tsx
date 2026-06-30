'use client'

import DurationPicker from '@/components/ui/DurationPicker'
import IconBtn from '@/components/ui/IconBtn'
import LazyTooltip from '@/components/ui/LazyTooltip'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EditableChapter } from '@/lib/chapters/chapterEditorUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

interface ChapterTitleInputProps {
  title: string
  onDraft: (title: string) => void
  onCommit: (title: string) => void
}

const ChapterTitleInput = memo(function ChapterTitleInput({ title, onDraft, onCommit }: ChapterTitleInputProps) {
  const [localTitle, setLocalTitle] = useState(title)
  const localTitleRef = useRef(title)
  const isEditingRef = useRef(false)

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
    <TextInput value={localTitle} size="small" className="min-w-52 text-sm" onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
  )
})

interface ChapterRowProps {
  chapter: EditableChapter
  chapterCount: number
  mediaDuration: number
  showSecondInputs: boolean
  isLocked: boolean
  isSelected: boolean
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  canPlay: boolean
  onStartChange: (start: number) => void
  onTitleDraft: (title: string) => void
  onTitleCommit: (title: string) => void
  onIncrementTime: (amount: number) => void
  onToggleLock: (shiftKey: boolean) => void
  onRemove: () => void
  onInsertBelow: () => void
  onPlay: () => void
  onAdjustStartTime: () => void
}

const TIME_INCREMENT = 1

function ChapterRow({
  chapter,
  chapterCount,
  mediaDuration,
  showSecondInputs,
  isLocked,
  isSelected,
  isPlayingChapter,
  isLoadingChapter,
  elapsedTime,
  canPlay,
  onStartChange,
  onTitleDraft,
  onTitleCommit,
  onIncrementTime,
  onToggleLock,
  onRemove,
  onInsertBelow,
  onPlay,
  onAdjustStartTime
}: ChapterRowProps) {
  const t = useTypeSafeTranslations()
  const cannotDecrement = chapter.id === 0 && chapter.start - TIME_INCREMENT < 0
  const cannotIncrement = chapter.start + TIME_INCREMENT >= mediaDuration

  return (
    <div className="flex items-center py-1">
      <div className="flex w-8 min-w-8 items-center md:w-12 md:min-w-12">#{chapter.id + 1}</div>

      <div className="w-38 min-w-38 px-1 md:w-40 md:min-w-40">
        <div className="flex items-center gap-1">
          <LazyTooltip text={t('TooltipSubtractOneSecond')} position="bottom">
            <button
              type="button"
              aria-label={t('TooltipSubtractOneSecond')}
              className={mergeClasses(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-300 transition-transform duration-150 hover:scale-110 hover:text-white',
                cannotDecrement && 'cursor-not-allowed opacity-50'
              )}
              disabled={cannotDecrement}
              onClick={() => onIncrementTime(-TIME_INCREMENT)}
            >
              <span className="material-symbols text-sm">remove</span>
            </button>
          </LazyTooltip>

          <div className="min-w-0 flex-1">
            {showSecondInputs ? (
              <TextInput type="number" value={String(chapter.start)} size="small" className="text-xs" onChange={(value) => onStartChange(Number(value))} />
            ) : (
              <DurationPicker value={chapter.start} showThreeDigitHour={mediaDuration >= 360000} size="small" className="w-full" onChange={onStartChange} />
            )}
          </div>

          <LazyTooltip text={t('TooltipAddOneSecond')} position="bottom">
            <button
              type="button"
              aria-label={t('TooltipAddOneSecond')}
              className={mergeClasses(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-300 transition-transform duration-150 hover:scale-110 hover:text-white',
                cannotIncrement && 'cursor-not-allowed opacity-50'
              )}
              disabled={cannotIncrement}
              onClick={() => onIncrementTime(TIME_INCREMENT)}
            >
              <span className="material-symbols text-sm">add</span>
            </button>
          </LazyTooltip>
        </div>
      </div>

      <div className="min-w-52 grow px-1">
        <ChapterTitleInput title={chapter.title} onDraft={onTitleDraft} onCommit={onTitleCommit} />
      </div>

      <div className="flex w-7 min-w-7 items-center justify-center px-1">
        <LazyTooltip text={isLocked ? t('TooltipUnlockChapter') : t('TooltipLockChapter')} position="bottom">
          <IconBtn
            ariaLabel={isLocked ? t('TooltipUnlockChapter') : t('TooltipLockChapter')}
            borderless
            size="small"
            className={mergeClasses(isLocked ? 'text-orange-400 hover:not-disabled:text-orange-300' : 'text-gray-300 hover:not-disabled:text-white')}
            onClick={(e) => onToggleLock(e.shiftKey)}
          >
            {isLocked ? 'lock' : 'lock_open'}
          </IconBtn>
        </LazyTooltip>
      </div>

      <div className="flex w-32 min-w-32 items-center px-2">
        <div className="flex items-center">
          {chapterCount > 1 && (
            <LazyTooltip text={t('MessageRemoveChapter')} position="bottom">
              <IconBtn ariaLabel={t('MessageRemoveChapter')} borderless size="small" className="text-gray-300 hover:not-disabled:text-error" onClick={onRemove}>
                delete
              </IconBtn>
            </LazyTooltip>
          )}

          <LazyTooltip text={t('MessageInsertChapterBelow')} position="bottom">
            <IconBtn ariaLabel={t('MessageInsertChapterBelow')} borderless size="small" className="text-gray-300 hover:not-disabled:text-success" onClick={onInsertBelow}>
              add_row_below
            </IconBtn>
          </LazyTooltip>

          <LazyTooltip text={isSelected && isPlayingChapter ? t('MessagePauseChapter') : t('MessagePlayChapter')} position="bottom">
            <IconBtn
              ariaLabel={isSelected && isPlayingChapter ? t('MessagePauseChapter') : t('MessagePlayChapter')}
              borderless
              size="small"
              loading={isSelected && isLoadingChapter}
              className="text-gray-300 hover:not-disabled:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canPlay}
              onClick={onPlay}
            >
              {isSelected && isPlayingChapter ? 'pause' : 'play_arrow'}
            </IconBtn>
          </LazyTooltip>

          {isSelected && (isPlayingChapter || isLoadingChapter) && (
            <LazyTooltip text={t('TooltipAdjustChapterStart')} position="bottom">
              <button
                type="button"
                className="ml-2 min-w-10 cursor-pointer font-mono text-xs text-gray-300 transition-colors hover:text-white"
                onClick={onAdjustStartTime}
              >
                {elapsedTime}s
              </button>
            </LazyTooltip>
          )}

          {chapter.error && (
            <LazyTooltip text={chapter.error} position="left">
              <span className="material-symbols text-error text-lg" aria-label={chapter.error}>
                error_outline
              </span>
            </LazyTooltip>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(ChapterRow)
