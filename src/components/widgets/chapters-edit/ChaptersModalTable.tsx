'use client'

import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import {
  BULK_CHAPTER_COUNT_MAX,
  BULK_CHAPTER_COUNT_MIN,
  clampBulkChapterCount,
  computeChapterEnds,
  getAudioTrackForTime,
  getChapterDirtyFields,
  getChapterTimeOverflow,
  type ChapterDirtySnapshot,
  type ChapterMatchDebug,
  type EditableChapter
} from '@/lib/chapters/chapterEditorUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { CHAPTERS_EDIT_TABLE_ATTR } from '@/lib/chapterEditorFocus'
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'
import ChapterEditTableRow from './ChapterEditTableRow'

const TABLE_CLASS = 'table-fixed w-full border-collapse text-sm'
const HEADER_CELL_CLASS = 'text-foreground-muted px-2 py-2 text-start text-xs font-semibold'

function startTimeColumnClass(mediaDuration: number, base: 'header' | 'cell'): string {
  const width =
    mediaDuration >= 360000 ? 'w-[7.5rem] min-w-[7.5rem] md:w-[8.75rem] md:min-w-[8.75rem]' : 'w-[6.5rem] min-w-[6.5rem] md:w-[7.25rem] md:min-w-[7.25rem]'
  return base === 'header' ? mergeClasses('text-start px-1 md:px-2', width) : mergeClasses('px-1 align-top md:px-2', width)
}

interface ChapterPreviewState {
  selectedChapterId: number | string | null
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  playChapter: (chapterId: number | string, start: number) => void
}

interface ChaptersModalTableProps {
  scrollContainerRef?: RefObject<HTMLDivElement | null>
  chapters: EditableChapter[]
  dirtyBaseline: Map<string, ChapterDirtySnapshot>
  mediaDuration: number
  addChapterInput: string
  bulkChapterCount: number
  selectedKeys: ReadonlySet<string>
  preview: ChapterPreviewState
  tracks: { startOffset: number; duration: number }[]
  showMatchDebug?: boolean
  chapterMatchDebug?: Map<number, ChapterMatchDebug>
  onAddChapterInputChange: (value: string) => void
  onBulkChapterCountChange: (count: number) => void
  onAddChapter: () => void
  onToggleAllSelected: (checked: boolean) => void
  onChapterCheckedChange: (clientKey: string, checked: boolean) => void
  onChapterStartChange: (chapterId: number, start: number) => void
  onChapterTitleDraft: (chapterId: number, title: string) => void
  onChapterTitleCommit: (chapterId: number, title: string) => void
  onChapterRemove: (chapterId: number) => void
  onChapterInsertBelow: (chapter: EditableChapter) => void
  onAdjustChapterStartTime: (chapterId: number) => void
  onRemoveSelected: () => void
}

export default function ChaptersModalTable({
  scrollContainerRef,
  chapters,
  dirtyBaseline,
  mediaDuration,
  addChapterInput,
  bulkChapterCount,
  selectedKeys,
  preview,
  tracks,
  showMatchDebug = false,
  chapterMatchDebug,
  onAddChapterInputChange,
  onBulkChapterCountChange,
  onAddChapter,
  onToggleAllSelected,
  onChapterCheckedChange,
  onChapterStartChange,
  onChapterTitleDraft,
  onChapterTitleCommit,
  onChapterRemove,
  onChapterInsertBelow,
  onAdjustChapterStartTime,
  onRemoveSelected
}: ChaptersModalTableProps) {
  const t = useTypeSafeTranslations()
  const [countInput, setCountInput] = useState(() => String(bulkChapterCount))

  useEffect(() => {
    setCountInput(String(bulkChapterCount))
  }, [bulkChapterCount])

  const handleCountChange = useCallback(
    (value: string) => {
      if (value === '') {
        setCountInput('')
        return
      }
      if (!/^\d+$/.test(value)) {
        return
      }
      const next = clampBulkChapterCount(Number(value))
      setCountInput(String(next))
      onBulkChapterCountChange(next)
    },
    [onBulkChapterCountChange]
  )

  const handleCountBlur = useCallback(() => {
    const next = clampBulkChapterCount(countInput === '' ? BULK_CHAPTER_COUNT_MIN : Number(countInput))
    setCountInput(String(next))
    onBulkChapterCountChange(next)
  }, [countInput, onBulkChapterCountChange])

  const selectableKeys = useMemo(() => chapters.map((chapter) => chapter.clientKey).filter((key): key is string => !!key), [chapters])
  const numSelected = selectedKeys.size
  const allSelected = selectableKeys.length > 0 && selectableKeys.every((key) => selectedKeys.has(key))
  const someSelected = selectableKeys.some((key) => selectedKeys.has(key))
  const showBulkHeader = numSelected > 0

  const columns = useMemo(
    () => [
      {
        label: (
          <div className="flex items-center justify-center">
            <Checkbox value={allSelected} partial={someSelected && !allSelected} size="small" ariaLabel={t('LabelSelectAll')} onChange={onToggleAllSelected} />
          </div>
        ),
        headerClassName: 'text-center ps-3 pe-2 w-12 min-w-12',
        cellClassName: 'ps-3 pe-2 w-12 min-w-12'
      },
      {
        label: t('LabelStart'),
        headerClassName: startTimeColumnClass(mediaDuration, 'header'),
        cellClassName: startTimeColumnClass(mediaDuration, 'cell')
      },
      {
        label: t('LabelTitle'),
        headerClassName: 'text-start px-2',
        cellClassName: 'px-2'
      },
      {
        label: '',
        headerClassName: 'hidden w-44 min-w-44 px-2 md:table-cell',
        cellClassName: 'hidden w-44 min-w-44 px-2 md:table-cell'
      }
    ],
    [allSelected, mediaDuration, onToggleAllSelected, someSelected, t]
  )

  const canPlayByChapterId = useMemo(() => {
    const map = new Map<number, boolean>()
    for (const chapter of chapters) {
      map.set(chapter.id, !!getAudioTrackForTime(tracks, chapter.start))
    }
    return map
  }, [chapters, tracks])

  const chapterEnds = useMemo(() => computeChapterEnds(chapters, mediaDuration), [chapters, mediaDuration])

  const renderEditRow = useCallback(
    (chapter: EditableChapter, index: number) => {
      const dirty = getChapterDirtyFields(chapter, dirtyBaseline)
      const playKey = chapter.clientKey ?? chapter.id
      const isPlaySelected = preview.selectedChapterId === playKey
      const clientKey = chapter.clientKey ?? ''
      const ended = chapterEnds[index]
      const overflow = ended ? getChapterTimeOverflow(ended.start, ended.end, mediaDuration) : null
      const matchDebug = chapterMatchDebug?.get(index) ?? null
      return (
        <ChapterEditTableRow
          key={chapter.clientKey}
          chapter={chapter}
          chapterCount={chapters.length}
          mediaDuration={mediaDuration}
          startDirty={dirty.start}
          baselineTitle={chapter.clientKey ? dirtyBaseline.get(chapter.clientKey)?.title : undefined}
          showMatchDebug={showMatchDebug}
          matchDebug={matchDebug}
          isChecked={!!clientKey && selectedKeys.has(clientKey)}
          isEvenRow={index % 2 === 1}
          isPlaySelected={isPlaySelected}
          isPlayingChapter={isPlaySelected && preview.isPlayingChapter}
          isLoadingChapter={isPlaySelected && preview.isLoadingChapter}
          elapsedTime={isPlaySelected ? preview.elapsedTime : 0}
          canPlay={canPlayByChapterId.get(chapter.id) ?? false}
          overflow={overflow}
          onCheckedChange={(checked) => {
            if (clientKey) onChapterCheckedChange(clientKey, checked)
          }}
          onStartChange={(start) => onChapterStartChange(chapter.id, start)}
          onTitleDraft={(chapterTitle) => onChapterTitleDraft(chapter.id, chapterTitle)}
          onTitleCommit={(chapterTitle) => onChapterTitleCommit(chapter.id, chapterTitle)}
          onRemove={() => onChapterRemove(chapter.id)}
          onInsertBelow={() => onChapterInsertBelow(chapter)}
          onPlay={() => preview.playChapter(chapter.clientKey ?? chapter.id, chapter.start)}
          onAdjustStartTime={() => onAdjustChapterStartTime(chapter.id)}
        />
      )
    },
    [
      canPlayByChapterId,
      chapterEnds,
      chapterMatchDebug,
      chapters.length,
      dirtyBaseline,
      mediaDuration,
      onAdjustChapterStartTime,
      onChapterCheckedChange,
      onChapterInsertBelow,
      onChapterRemove,
      onChapterStartChange,
      onChapterTitleCommit,
      onChapterTitleDraft,
      preview,
      selectedKeys,
      showMatchDebug
    ]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col" {...{ [CHAPTERS_EDIT_TABLE_ATTR]: true }}>
      <div className="border-border relative shrink-0 overflow-x-auto rounded-t-md border border-b-0">
        <table className={TABLE_CLASS}>
          <thead className="bg-table-header-bg">
            <tr className="border-border border-b">
              {columns.map((column, index) => (
                <th key={index} className={mergeClasses(HEADER_CELL_CLASS, column.headerClassName)} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        {showBulkHeader && (
          <div className="border-border bg-table-header-bg absolute inset-0 z-20 flex items-center border-b">
            <div className="flex h-full w-12 min-w-12 items-center justify-center ps-3 pe-2">
              <Checkbox
                value={allSelected}
                partial={someSelected && !allSelected}
                size="small"
                checkboxBgClass="bg-bg"
                ariaLabel={t('LabelSelectAll')}
                onChange={onToggleAllSelected}
              />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-between gap-2 px-2">
              <span className="text-foreground text-sm whitespace-nowrap">{t('MessageSelected', { 0: numSelected })}</span>
              <Btn className="h-7 shrink-0" size="small" color="bg-error" onClick={onRemoveSelected}>
                {t('ButtonRemoveSelected')}
              </Btn>
            </div>
          </div>
        )}
      </div>

      <div ref={scrollContainerRef} className="border-border min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-b-md border">
        <table className={TABLE_CLASS}>
          <tbody>{chapters.map((chapter, index) => renderEditRow(chapter, index))}</tbody>
        </table>
        <div className="mt-3 flex items-end gap-2 px-2 pb-2">
          <TextInput
            value={addChapterInput}
            label={t('LabelAddChapters')}
            placeholder={t('PlaceholderBulkChapterInput')}
            size="small"
            className="min-w-0 grow text-xs"
            onChange={onAddChapterInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAddChapter()
            }}
          />
          <TextInput
            type="number"
            value={countInput}
            label={t('LabelHowMany')}
            size="small"
            min={BULK_CHAPTER_COUNT_MIN}
            max={BULK_CHAPTER_COUNT_MAX}
            step={1}
            className="w-fit shrink-0 text-xs"
            wrapperClassName="w-16"
            onChange={handleCountChange}
            onBlur={handleCountBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAddChapter()
            }}
          />
          <Tooltip text={t('TooltipAddChapters')} position="bottom">
            <IconBtn
              ariaLabel={t('TooltipAddChapters')}
              borderless
              size="small"
              className={!addChapterInput.trim() ? 'mb-0.5 cursor-not-allowed opacity-50' : 'mb-0.5'}
              disabled={!addChapterInput.trim()}
              onClick={onAddChapter}
            >
              add
            </IconBtn>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
