'use client'

import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EditableChapter } from '@/lib/chapters/chapterEditorUtils'
import { getAudioTrackForTime } from '@/lib/chapters/chapterEditorUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { memo, useMemo } from 'react'
import ChapterRow from './ChapterRow'

interface ChapterPreviewState {
  selectedChapterId: number | null
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  playChapter: (chapterId: number, start: number) => void
}

interface ChaptersListSectionProps {
  newChapters: EditableChapter[]
  mediaDuration: number
  showSecondInputs: boolean
  bulkChapterInput: string
  lockedChapters: Set<number>
  allChaptersLocked: boolean
  preview: ChapterPreviewState
  tracks: { startOffset: number; duration: number }[]
  onToggleAllChaptersLock: () => void
  onBulkChapterInputChange: (value: string) => void
  onBulkChapterAdd: () => void
  onChapterStartChange: (chapterId: number, start: number) => void
  onChapterTitleDraft: (chapterId: number, title: string) => void
  onChapterTitleCommit: (chapterId: number, title: string) => void
  onChapterIncrementTime: (chapterId: number, amount: number) => void
  onToggleChapterLock: (chapterId: number, shiftKey: boolean) => void
  onChapterRemove: (chapterId: number) => void
  onChapterInsertBelow: (chapter: EditableChapter) => void
  onAdjustChapterStartTime: (chapterId: number) => void
}

function ChaptersListSection({
  newChapters,
  mediaDuration,
  showSecondInputs,
  bulkChapterInput,
  lockedChapters,
  allChaptersLocked,
  preview,
  tracks,
  onToggleAllChaptersLock,
  onBulkChapterInputChange,
  onBulkChapterAdd,
  onChapterStartChange,
  onChapterTitleDraft,
  onChapterTitleCommit,
  onChapterIncrementTime,
  onToggleChapterLock,
  onChapterRemove,
  onChapterInsertBelow,
  onAdjustChapterStartTime
}: ChaptersListSectionProps) {
  const t = useTypeSafeTranslations()

  const canPlayByChapterId = useMemo(() => {
    const map = new Map<number, boolean>()
    for (const chapter of newChapters) {
      map.set(chapter.id, !!getAudioTrackForTime(tracks, chapter.start))
    }
    return map
  }, [newChapters, tracks])

  return (
    <div className="grid grid-cols-[2rem_9.5rem_minmax(13rem,1fr)_1.75rem_13rem] items-center md:grid-cols-[3rem_10rem_minmax(13rem,1fr)_1.75rem_13rem]">
      <div className="text-foreground-muted contents text-xs font-semibold uppercase">
        <div />
        <div className="px-1 ps-8 md:ps-8">{t('LabelStart')}</div>
        <div className="px-1">{t('LabelTitle')}</div>
        <div className="flex items-center justify-center px-1">
          <Tooltip text={allChaptersLocked ? t('TooltipUnlockAllChapters') : t('TooltipLockAllChapters')} position="bottom">
            <IconBtn
              ariaLabel={allChaptersLocked ? t('TooltipUnlockAllChapters') : t('TooltipLockAllChapters')}
              borderless
              size="small"
              className={allChaptersLocked ? 'text-warning hover:not-disabled:text-warning' : 'text-foreground-muted hover:not-disabled:text-foreground'}
              onClick={onToggleAllChaptersLock}
            >
              {allChaptersLocked ? 'lock' : 'lock_open'}
            </IconBtn>
          </Tooltip>
        </div>
        <div />
      </div>

      {newChapters.map((chapter) => {
        const isSelected = preview.selectedChapterId === chapter.id
        return (
          <ChapterRow
            key={chapter.clientKey}
            chapter={chapter}
            chapterCount={newChapters.length}
            mediaDuration={mediaDuration}
            showSecondInputs={showSecondInputs}
            isLocked={lockedChapters.has(chapter.id)}
            isSelected={isSelected}
            isPlayingChapter={isSelected && preview.isPlayingChapter}
            isLoadingChapter={isSelected && preview.isLoadingChapter}
            elapsedTime={isSelected ? preview.elapsedTime : 0}
            canPlay={canPlayByChapterId.get(chapter.id) ?? false}
            onStartChange={(start) => onChapterStartChange(chapter.id, start)}
            onTitleDraft={(chapterTitle) => onChapterTitleDraft(chapter.id, chapterTitle)}
            onTitleCommit={(chapterTitle) => onChapterTitleCommit(chapter.id, chapterTitle)}
            onIncrementTime={(amount) => onChapterIncrementTime(chapter.id, amount)}
            onToggleLock={(shiftKey) => onToggleChapterLock(chapter.id, shiftKey)}
            onRemove={() => onChapterRemove(chapter.id)}
            onInsertBelow={() => onChapterInsertBelow(chapter)}
            onPlay={() => preview.playChapter(chapter.id, chapter.start)}
            onAdjustStartTime={() => onAdjustChapterStartTime(chapter.id)}
          />
        )
      })}

      <div className="contents">
        <div className="py-1 pt-4" />
        <div className="py-1 pt-4" />
        <div className="min-w-0 px-1 py-1 pt-4">
          <TextInput
            value={bulkChapterInput}
            placeholder={t('PlaceholderBulkChapterInput')}
            size="small"
            className="w-full text-xs"
            onChange={onBulkChapterInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onBulkChapterAdd()
            }}
          />
        </div>
        <div className="flex items-center justify-center px-1 py-1 pt-4">
          <Tooltip text={t('TooltipAddChapters')} position="bottom">
            <IconBtn
              ariaLabel={t('TooltipAddChapters')}
              borderless
              size="small"
              className={mergeClasses('text-foreground-muted hover:not-disabled:text-success', !bulkChapterInput.trim() && 'cursor-not-allowed opacity-50')}
              disabled={!bulkChapterInput.trim()}
              onClick={onBulkChapterAdd}
            >
              add
            </IconBtn>
          </Tooltip>
        </div>
        <div className="py-1 pt-4" />
      </div>
    </div>
  )
}

export default memo(ChaptersListSection)
