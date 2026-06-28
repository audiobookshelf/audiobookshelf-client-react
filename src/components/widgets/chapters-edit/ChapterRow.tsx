'use client'

import DurationPicker from '@/components/ui/DurationPicker'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EditableChapter } from '@/lib/chapters/chapterEditorUtils'
import { mergeClasses } from '@/lib/merge-classes'

interface ChapterRowProps {
  chapter: EditableChapter
  chapterCount: number
  mediaDuration: number
  showSecondInputs: boolean
  isLocked: boolean
  selectedChapterId: number | null
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  canPlay: boolean
  onStartChange: (start: number) => void
  onTitleChange: (title: string) => void
  onIncrementTime: (amount: number) => void
  onToggleLock: (shiftKey: boolean) => void
  onRemove: () => void
  onInsertBelow: () => void
  onPlay: () => void
  onAdjustStartTime: () => void
}

const TIME_INCREMENT = 1

export default function ChapterRow({
  chapter,
  chapterCount,
  mediaDuration,
  showSecondInputs,
  isLocked,
  selectedChapterId,
  isPlayingChapter,
  isLoadingChapter,
  elapsedTime,
  canPlay,
  onStartChange,
  onTitleChange,
  onIncrementTime,
  onToggleLock,
  onRemove,
  onInsertBelow,
  onPlay,
  onAdjustStartTime
}: ChapterRowProps) {
  const t = useTypeSafeTranslations()
  const isSelected = selectedChapterId === chapter.id
  const cannotDecrement = chapter.id === 0 && chapter.start - TIME_INCREMENT < 0
  const cannotIncrement = chapter.start + TIME_INCREMENT >= mediaDuration

  return (
    <div className="flex items-center py-1">
      <div className="flex w-8 min-w-8 items-center md:w-12 md:min-w-12">#{chapter.id + 1}</div>

      <div className="w-38 min-w-38 px-1 md:w-40 md:min-w-40">
        <div className="flex items-center gap-1">
          <Tooltip text={t('TooltipSubtractOneSecond')} position="bottom">
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
          </Tooltip>

          <div className="min-w-0 flex-1">
            {showSecondInputs ? (
              <TextInput type="number" value={String(chapter.start)} size="small" className="text-xs" onChange={(value) => onStartChange(Number(value))} />
            ) : (
              <DurationPicker value={chapter.start} showThreeDigitHour={mediaDuration >= 360000} size="small" className="w-full" onChange={onStartChange} />
            )}
          </div>

          <Tooltip text={t('TooltipAddOneSecond')} position="bottom">
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
          </Tooltip>
        </div>
      </div>

      <div className="min-w-52 grow px-1">
        <TextInput value={chapter.title} size="small" className="min-w-52 text-sm" onChange={onTitleChange} />
      </div>

      <div className="flex w-7 min-w-7 items-center justify-center px-1">
        <Tooltip text={isLocked ? t('TooltipUnlockChapter') : t('TooltipLockChapter')} position="bottom">
          <IconBtn
            ariaLabel={isLocked ? t('TooltipUnlockChapter') : t('TooltipLockChapter')}
            borderless
            size="small"
            className={mergeClasses(isLocked ? 'text-orange-400 hover:not-disabled:text-orange-300' : 'text-gray-300 hover:not-disabled:text-white')}
            onClick={(e) => onToggleLock(e.shiftKey)}
          >
            {isLocked ? 'lock' : 'lock_open'}
          </IconBtn>
        </Tooltip>
      </div>

      <div className="flex w-32 min-w-32 items-center px-2">
        <div className="flex items-center">
          {chapterCount > 1 && (
            <Tooltip text={t('MessageRemoveChapter')} position="bottom">
              <IconBtn ariaLabel={t('MessageRemoveChapter')} borderless size="small" className="text-gray-300 hover:not-disabled:text-error" onClick={onRemove}>
                delete
              </IconBtn>
            </Tooltip>
          )}

          <Tooltip text={t('MessageInsertChapterBelow')} position="bottom">
            <IconBtn ariaLabel={t('MessageInsertChapterBelow')} borderless size="small" className="text-gray-300 hover:not-disabled:text-success" onClick={onInsertBelow}>
              add_row_below
            </IconBtn>
          </Tooltip>

          <Tooltip text={isSelected && isPlayingChapter ? t('MessagePauseChapter') : t('MessagePlayChapter')} position="bottom">
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
          </Tooltip>

          {isSelected && (isPlayingChapter || isLoadingChapter) && (
            <Tooltip text={t('TooltipAdjustChapterStart')} position="bottom">
              <button
                type="button"
                className="ml-2 min-w-10 cursor-pointer font-mono text-xs text-gray-300 transition-colors hover:text-white"
                onClick={onAdjustStartTime}
              >
                {elapsedTime}s
              </button>
            </Tooltip>
          )}

          {chapter.error && (
            <Tooltip text={chapter.error} position="left">
              <span className="material-symbols text-error text-lg">error_outline</span>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}
