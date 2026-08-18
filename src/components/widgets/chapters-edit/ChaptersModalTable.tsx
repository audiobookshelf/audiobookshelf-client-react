'use client'

import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable from '@/components/ui/SimpleDataTable'
import Tooltip from '@/components/ui/Tooltip'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import {
  computeChapterEnds,
  getAudioTrackForTime,
  getChapterDirtyFields,
  hasNonPlaceholderChapters,
  type ChapterDirtySnapshot,
  type EditableChapter
} from '@/lib/chapters/chapterEditorUtils'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useMemo } from 'react'
import ChapterEditTableRow from './ChapterEditTableRow'

interface ChapterPreviewState {
  selectedChapterId: number | string | null
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  playChapter: (chapterId: number | string, start: number) => void
}

interface ChaptersModalTableProps {
  isEditMode: boolean
  chapters: EditableChapter[]
  dirtyBaseline: Map<string, ChapterDirtySnapshot>
  mediaDuration: number
  showSecondInputs: boolean
  bulkChapterInput: string
  preview: ChapterPreviewState
  tracks: { startOffset: number; duration: number }[]
  onBulkChapterInputChange: (value: string) => void
  onBulkChapterAdd: () => void
  onChapterStartChange: (chapterId: number, start: number) => void
  onChapterTitleDraft: (chapterId: number, title: string) => void
  onChapterTitleCommit: (chapterId: number, title: string) => void
  onChapterIncrementTime: (chapterId: number, amount: number) => void
  onChapterRemove: (chapterId: number) => void
  onChapterInsertBelow: (chapter: EditableChapter) => void
  onAdjustChapterStartTime: (chapterId: number) => void
}

export default function ChaptersModalTable({
  isEditMode,
  chapters,
  dirtyBaseline,
  mediaDuration,
  showSecondInputs,
  bulkChapterInput,
  preview,
  tracks,
  onBulkChapterInputChange,
  onBulkChapterAdd,
  onChapterStartChange,
  onChapterTitleDraft,
  onChapterTitleCommit,
  onChapterIncrementTime,
  onChapterRemove,
  onChapterInsertBelow,
  onAdjustChapterStartTime
}: ChaptersModalTableProps) {
  const t = useTypeSafeTranslations()

  const displayChapters = useMemo(
    () =>
      computeChapterEnds(chapters, mediaDuration).map((chapter, index) => ({
        ...chapter,
        clientKey: chapters[index]?.clientKey
      })),
    [chapters, mediaDuration]
  )
  const showTable = hasNonPlaceholderChapters(chapters)

  const handleGoToTimestamp = useCallback((time: number) => {
    console.log('Go to timestamp:', time)
  }, [])

  const viewColumns = useMemo(
    () => [
      {
        label: t('LabelTitle'),
        headerClassName: 'text-start px-4',
        cellClassName: 'px-4',
        accessor: (row: EditableChapter) => <span className={getChapterDirtyFields(row, dirtyBaseline).title ? 'text-info' : undefined}>{row.title}</span>
      },
      {
        label: t('LabelStart'),
        headerClassName: 'text-center px-2',
        cellClassName: 'text-center px-2',
        accessor: (row: EditableChapter) => (
          <div
            className={mergeClasses('cursor-pointer text-center font-mono hover:underline', getChapterDirtyFields(row, dirtyBaseline).start && 'text-info')}
            onClick={(e) => {
              e.stopPropagation()
              handleGoToTimestamp(row.start)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                handleGoToTimestamp(row.start)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Go to timestamp ${secondsToTimestamp(row.start)}`}
          >
            {secondsToTimestamp(row.start)}
          </div>
        )
      },
      {
        label: t('LabelDuration'),
        headerClassName: 'text-center px-2 w-16 md:w-24 min-w-16 md:min-w-24',
        cellClassName: 'text-center px-2 font-mono',
        accessor: (row: EditableChapter) => (
          <span className={getChapterDirtyFields(row, dirtyBaseline).duration ? 'text-info' : undefined}>
            {secondsToTimestamp(Math.max(0, row.end - row.start))}
          </span>
        ),
        hiddenBelow: 'md' as const
      }
    ],
    [dirtyBaseline, handleGoToTimestamp, t]
  )

  const editColumns = useMemo(
    () => [
      {
        label: t('LabelStart'),
        headerClassName: 'text-start px-2 w-[9.5rem] min-w-[9.5rem] md:w-40 md:min-w-40',
        cellClassName: 'px-2 w-[9.5rem] min-w-[9.5rem] md:w-40 md:min-w-40'
      },
      {
        label: t('LabelTitle'),
        headerClassName: 'text-start px-2',
        cellClassName: 'px-2'
      },
      {
        label: '',
        headerClassName: 'w-52 min-w-52 px-2',
        cellClassName: 'w-52 min-w-52 px-2'
      }
    ],
    [t]
  )

  const canPlayByChapterId = useMemo(() => {
    const map = new Map<number, boolean>()
    for (const chapter of chapters) {
      map.set(chapter.id, !!getAudioTrackForTime(tracks, chapter.start))
    }
    return map
  }, [chapters, tracks])

  const renderEditRow = useCallback(
    (chapter: EditableChapter) => {
      const dirty = getChapterDirtyFields(chapter, dirtyBaseline)
      const isSelected = preview.selectedChapterId === chapter.id
      return (
        <ChapterEditTableRow
          key={chapter.clientKey}
          chapter={chapter}
          chapterCount={chapters.length}
          mediaDuration={mediaDuration}
          showSecondInputs={showSecondInputs}
          startDirty={dirty.start}
          baselineTitle={chapter.clientKey ? dirtyBaseline.get(chapter.clientKey)?.title : undefined}
          isSelected={isSelected}
          isPlayingChapter={isSelected && preview.isPlayingChapter}
          isLoadingChapter={isSelected && preview.isLoadingChapter}
          elapsedTime={isSelected ? preview.elapsedTime : 0}
          canPlay={canPlayByChapterId.get(chapter.id) ?? false}
          onStartChange={(start) => onChapterStartChange(chapter.id, start)}
          onTitleDraft={(chapterTitle) => onChapterTitleDraft(chapter.id, chapterTitle)}
          onTitleCommit={(chapterTitle) => onChapterTitleCommit(chapter.id, chapterTitle)}
          onIncrementTime={(amount) => onChapterIncrementTime(chapter.id, amount)}
          onRemove={() => onChapterRemove(chapter.id)}
          onInsertBelow={() => onChapterInsertBelow(chapter)}
          onPlay={() => preview.playChapter(chapter.id, chapter.start)}
          onAdjustStartTime={() => onAdjustChapterStartTime(chapter.id)}
        />
      )
    },
    [
      canPlayByChapterId,
      chapters.length,
      dirtyBaseline,
      mediaDuration,
      onAdjustChapterStartTime,
      onChapterIncrementTime,
      onChapterInsertBelow,
      onChapterRemove,
      onChapterStartChange,
      onChapterTitleCommit,
      onChapterTitleDraft,
      preview,
      showSecondInputs
    ]
  )

  return (
    <div>
      {!showTable && !isEditMode ? (
        <div className="py-8 text-center" role="status">
          <p className="text-foreground-muted">{t('MessageNoChapters')}</p>
        </div>
      ) : isEditMode ? (
        <>
          <SimpleDataTable
            data={chapters}
            columns={editColumns}
            tableClassName="table-fixed"
            getRowKey={(row) => row.clientKey ?? String(row.id)}
            renderRow={(row) => renderEditRow(row)}
          />
          <div className="mt-3 flex items-center gap-2">
            <TextInput
              value={bulkChapterInput}
              placeholder={t('PlaceholderBulkChapterInput')}
              size="small"
              className="min-w-0 grow text-xs"
              onChange={onBulkChapterInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onBulkChapterAdd()
              }}
            />
            <Tooltip text={t('TooltipAddChapters')} position="bottom">
              <IconBtn
                ariaLabel={t('TooltipAddChapters')}
                borderless
                size="small"
                className={!bulkChapterInput.trim() ? 'cursor-not-allowed opacity-50' : undefined}
                disabled={!bulkChapterInput.trim()}
                onClick={onBulkChapterAdd}
              >
                add
              </IconBtn>
            </Tooltip>
          </div>
        </>
      ) : (
        <SimpleDataTable data={displayChapters} columns={viewColumns} getRowKey={(row) => row.clientKey ?? String(row.id)} />
      )}
    </div>
  )
}
