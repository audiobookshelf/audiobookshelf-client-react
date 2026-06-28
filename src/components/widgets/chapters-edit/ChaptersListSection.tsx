'use client'

import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EditableChapter } from '@/lib/chapters/chapterEditorUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { TransitionGroup } from 'react-transition-group'
import ChapterRowItem from './ChapterRowItem'

interface ChapterPreviewState {
  selectedChapterId: number | null
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  getAudioTrackForTime: (time: number) => unknown
  playChapter: (chapterId: number, start: number) => void
}

interface ChaptersListSectionProps {
  newChapters: EditableChapter[]
  chapterListKey: number
  mediaDuration: number
  showSecondInputs: boolean
  bulkChapterInput: string
  lockedChapters: Set<number>
  allChaptersLocked: boolean
  preview: ChapterPreviewState
  onToggleAllChaptersLock: () => void
  onBulkChapterInputChange: (value: string) => void
  onBulkChapterAdd: () => void
  onChapterStartChange: (chapterId: number, start: number) => void
  onChapterTitleChange: (chapterId: number, title: string) => void
  onChapterIncrementTime: (chapterId: number, amount: number) => void
  onToggleChapterLock: (chapterId: number, shiftKey: boolean) => void
  onChapterRemove: (chapterId: number) => void
  onChapterInsertBelow: (chapter: EditableChapter) => void
  onAdjustChapterStartTime: (chapterId: number) => void
}

export default function ChaptersListSection({
  newChapters,
  chapterListKey,
  mediaDuration,
  showSecondInputs,
  bulkChapterInput,
  lockedChapters,
  allChaptersLocked,
  preview,
  onToggleAllChaptersLock,
  onBulkChapterInputChange,
  onBulkChapterAdd,
  onChapterStartChange,
  onChapterTitleChange,
  onChapterIncrementTime,
  onToggleChapterLock,
  onChapterRemove,
  onChapterInsertBelow,
  onAdjustChapterStartTime
}: ChaptersListSectionProps) {
  const t = useTypeSafeTranslations()

  return (
    <>
      <div className="mb-2 flex text-xs font-semibold text-gray-300 uppercase">
        <div className="w-8 min-w-8 md:w-12 md:min-w-12" />
        <div className="w-38 min-w-38 px-1 ps-8 md:w-40 md:min-w-40">{t('LabelStart')}</div>
        <div className="min-w-54 grow px-1">{t('LabelTitle')}</div>
        <div className="flex w-7 min-w-7 items-center justify-center px-1">
          <Tooltip text={allChaptersLocked ? t('TooltipUnlockAllChapters') : t('TooltipLockAllChapters')} position="bottom">
            <IconBtn
              ariaLabel={allChaptersLocked ? t('TooltipUnlockAllChapters') : t('TooltipLockAllChapters')}
              borderless
              size="small"
              className={allChaptersLocked ? 'text-orange-400 hover:text-orange-300' : 'text-gray-300 hover:text-white'}
              onClick={onToggleAllChaptersLock}
            >
              {allChaptersLocked ? 'lock' : 'lock_open'}
            </IconBtn>
          </Tooltip>
        </div>
        <div className="w-32" />
      </div>

      <TransitionGroup key={chapterListKey} component={null}>
        {newChapters.map((chapter) => (
          <ChapterRowItem
            key={chapter.clientKey}
            chapter={chapter}
            chapterCount={newChapters.length}
            mediaDuration={mediaDuration}
            showSecondInputs={showSecondInputs}
            isLocked={lockedChapters.has(chapter.id)}
            selectedChapterId={preview.selectedChapterId}
            isPlayingChapter={preview.isPlayingChapter}
            isLoadingChapter={preview.isLoadingChapter}
            elapsedTime={preview.elapsedTime}
            canPlay={!!preview.getAudioTrackForTime(chapter.start)}
            onStartChange={(start) => onChapterStartChange(chapter.id, start)}
            onTitleChange={(chapterTitle) => onChapterTitleChange(chapter.id, chapterTitle)}
            onIncrementTime={(amount) => onChapterIncrementTime(chapter.id, amount)}
            onToggleLock={(shiftKey) => onToggleChapterLock(chapter.id, shiftKey)}
            onRemove={() => onChapterRemove(chapter.id)}
            onInsertBelow={() => onChapterInsertBelow(chapter)}
            onPlay={() => preview.playChapter(chapter.id, chapter.start)}
            onAdjustStartTime={() => onAdjustChapterStartTime(chapter.id)}
          />
        ))}
      </TransitionGroup>

      <div className="mt-4 mb-2 flex items-center">
        <div className="w-8 min-w-8 md:w-12 md:min-w-12" />
        <div className="w-38 min-w-38 px-1 md:w-40 md:min-w-40" />
        <div className="flex grow items-center gap-2 px-1">
          <TextInput
            value={bulkChapterInput}
            placeholder={t('PlaceholderBulkChapterInput')}
            size="small"
            className="min-w-52 grow text-xs"
            onChange={onBulkChapterInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onBulkChapterAdd()
            }}
          />
        </div>
        <div className="w-39 min-w-39 px-1 py-1">
          <Tooltip text={t('TooltipAddChapters')} position="bottom" className="inline-block align-middle">
            <IconBtn
              ariaLabel={t('TooltipAddChapters')}
              borderless
              size="small"
              className={mergeClasses('hover:not-disabled:text-success text-gray-300', !bulkChapterInput.trim() && 'cursor-not-allowed opacity-50')}
              disabled={!bulkChapterInput.trim()}
              onClick={onBulkChapterAdd}
            >
              add
            </IconBtn>
          </Tooltip>
        </div>
      </div>
    </>
  )
}
