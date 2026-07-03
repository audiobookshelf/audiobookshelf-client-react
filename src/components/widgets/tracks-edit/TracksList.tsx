'use client'

import SortableList, { type SortableListDragHandleProps } from '@/components/widgets/SortableList'
import TrackRow from '@/components/widgets/tracks-edit/TrackRow'
import { getTracksListColumnVisibility, TRACKS_COL_COMPACT, TRACKS_COL_LG, TRACKS_COL_LG_FLEX, TRACKS_COL_XL_FLEX, TRACKS_FILENAME_COLUMN_CLASS } from '@/components/widgets/tracks-edit/tracksListColumns'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EditableTrackFile, TrackSortKey } from '@/hooks/useTrackEditor'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useMemo } from 'react'

interface TracksListProps {
  files: EditableTrackFile[]
  newTrackIndices: (number | null)[]
  currentSort: TrackSortKey
  onSortEnd: (sortedItems: EditableTrackFile[]) => void
  onSort: (sortKey: TrackSortKey) => void
  onIncludeToggle: (ino: string, include: boolean) => void
}

interface SortableTrackFile extends EditableTrackFile {
  id: string
}

function SortColumnHeader({
  label,
  sortKey,
  currentSort,
  className,
  onSort
}: {
  label: string
  sortKey: TrackSortKey
  currentSort: TrackSortKey
  className?: string
  onSort: (sortKey: TrackSortKey) => void
}) {
  const isActive = currentSort === sortKey

  return (
    <button
      type="button"
      className={mergeClasses(
        'text-foreground-subdued hover:text-foreground flex w-full flex-nowrap cursor-pointer items-center border-0 bg-transparent p-0 text-sm',
        className
      )}
      onClick={() => onSort(sortKey)}
      onMouseDown={(e) => e.preventDefault()}
    >
      <span className="text-foreground min-w-0 leading-tight">{label}</span>
      <span
        className={mergeClasses('material-symbols ms-1 shrink-0', isActive ? 'text-foreground text-lg' : 'text-sm')}
        aria-hidden
      >
        {isActive ? 'expand_more' : 'unfold_more'}
      </span>
    </button>
  )
}

export default function TracksList({ files, newTrackIndices, currentSort, onSortEnd, onSort, onIncludeToggle }: TracksListProps) {
  const t = useTypeSafeTranslations()
  const columnVisibility = useMemo(() => getTracksListColumnVisibility(files), [files])

  const sortableItems: SortableTrackFile[] = files.map((f) => ({ ...f, id: f.ino }))

  const handleSortEnd = useCallback(
    (sortedItems: SortableTrackFile[]) => {
      onSortEnd(sortedItems.map(({ id: _id, ...rest }) => rest))
    },
    [onSortEnd]
  )

  const renderItem = useCallback(
    (file: SortableTrackFile, index: number, dragHandle: SortableListDragHandleProps) => (
      <TrackRow
        file={file}
        listIndex={index}
        newIndex={newTrackIndices[index] ?? null}
        showDragHandle
        dragHandle={dragHandle}
        columnVisibility={columnVisibility}
        onIncludeToggle={onIncludeToggle}
      />
    ),
    [columnVisibility, newTrackIndices, onIncludeToggle]
  )

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="border-border bg-primary flex w-full shrink-0 items-center overflow-hidden border border-b-0 py-4 text-sm">
        <div className="w-10 shrink-0 lg:w-12" />
        <div className={mergeClasses(TRACKS_COL_COMPACT, 'w-10 shrink-0 justify-center px-1 text-center')} role="columnheader" aria-label={t('LabelCurrent')}>
          <span aria-hidden>#</span>
        </div>
        <div className={mergeClasses(TRACKS_COL_LG_FLEX, 'w-12 shrink-0 justify-center px-4 text-center')}>{t('LabelNew')}</div>
        <SortColumnHeader
          label={t('LabelCurrent')}
          sortKey="current"
          currentSort={currentSort}
          className={mergeClasses(TRACKS_COL_LG_FLEX, 'w-24 shrink-0 px-4')}
          onSort={onSort}
        />
        {columnVisibility.trackFromFilename && (
          <SortColumnHeader
            label={t('LabelTrackFromFilename')}
            sortKey="track-filename"
            currentSort={currentSort}
            className={mergeClasses(TRACKS_COL_LG_FLEX, 'w-32 shrink-0 px-4')}
            onSort={onSort}
          />
        )}
        {columnVisibility.trackFromMetadata && (
          <SortColumnHeader
            label={t('LabelTrackFromMetadata')}
            sortKey="metadata"
            currentSort={currentSort}
            className={mergeClasses(TRACKS_COL_LG_FLEX, 'w-32 shrink-0 px-4')}
            onSort={onSort}
          />
        )}
        {columnVisibility.discFromFilename && (
          <div className={mergeClasses(TRACKS_COL_XL_FLEX, 'w-20 shrink-0 justify-center text-center')}>{t('LabelDiscFromFilename')}</div>
        )}
        {columnVisibility.discFromMetadata && (
          <div className={mergeClasses(TRACKS_COL_XL_FLEX, 'w-20 shrink-0 justify-center text-center')}>{t('LabelDiscFromMetadata')}</div>
        )}
        <div className={mergeClasses(TRACKS_COL_COMPACT, TRACKS_FILENAME_COLUMN_CLASS, 'justify-start px-2')} role="columnheader">
          {t('LabelFilename')}
        </div>
        <SortColumnHeader
          label={t('LabelFilename')}
          sortKey="filename"
          currentSort={currentSort}
          className={mergeClasses(TRACKS_FILENAME_COLUMN_CLASS, TRACKS_COL_LG_FLEX, 'px-4')}
          onSort={onSort}
        />
        <div className={mergeClasses(TRACKS_COL_LG_FLEX, 'w-20 shrink-0 justify-center text-center')}>{t('LabelSize')}</div>
        <div className={mergeClasses(TRACKS_COL_LG_FLEX, 'w-20 shrink-0 justify-center text-center')}>{t('LabelDuration')}</div>
        {columnVisibility.notes && <div className={mergeClasses(TRACKS_COL_XL_FLEX, 'w-56 shrink-0')}>{t('LabelNotes')}</div>}
        <div className={mergeClasses(TRACKS_COL_COMPACT, 'w-16 shrink-0 justify-center px-1 text-center')} role="columnheader">
          {t('LabelInclude')}
        </div>
        <div className={mergeClasses(TRACKS_COL_LG, 'w-28 shrink-0 px-1 text-center leading-tight whitespace-pre-line')}>
          {t('LabelIncludeInTracklist')}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <SortableList
          items={sortableItems}
          onSortEnd={handleSortEnd}
          renderItem={renderItem}
          isItemDisabled={(file) => !file.include}
          reorderAnimationDuration={500}
          className="border-border min-h-[30px] border border-t-0"
          itemClassName=""
        />
      </div>
    </div>
  )
}
