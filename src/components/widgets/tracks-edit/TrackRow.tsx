'use client'

import ToggleSwitch from '@/components/ui/ToggleSwitch'
import IconBtn from '@/components/ui/IconBtn'
import TruncatingTooltipText from '@/components/ui/TruncatingTooltipText'
import type { SortableListDragHandleProps } from '@/components/widgets/SortableList'
import {
  TRACKS_COL_COMPACT_CELL,
  TRACKS_COL_LG,
  TRACKS_COL_XL,
  TRACKS_FILENAME_COLUMN_CLASS,
  type TracksListColumnVisibility
} from '@/components/widgets/tracks-edit/tracksListColumns'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import type { EditableTrackFile } from '@/hooks/useTrackEditor'
import { DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH, DRAG_HANDLE_GRAB_CURSOR } from '@/lib/dragHandleClasses'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { bytesPretty } from '@/lib/string'

interface TrackRowProps {
  file: EditableTrackFile
  listIndex: number
  newIndex: number | null
  showDragHandle: boolean
  dragHandle: SortableListDragHandleProps
  columnVisibility: TracksListColumnVisibility
  onIncludeToggle: (ino: string, include: boolean) => void
}

export default function TrackRow({ file, listIndex, newIndex, showDragHandle, dragHandle, columnVisibility, onIncludeToggle }: TrackRowProps) {
  const currentIndex = file.include && file.index != null && file.index >= 0 ? file.index : null
  const isEvenRow = listIndex % 2 === 1
  const primaryInputCanHover = usePrimaryInputCanHover()

  return (
    <div
      className={mergeClasses(
        'border-border flex w-full min-w-0 items-center overflow-hidden border-x border-b [@media(pointer:coarse)]:min-h-11',
        file.include ? mergeClasses(isEvenRow && 'bg-black/25', 'hover:bg-black/10') : 'cursor-not-allowed bg-red-500/25 hover:bg-red-600/25'
      )}
    >
      {showDragHandle && (
        <div className="flex w-10 shrink-0 items-center justify-center self-stretch lg:w-12">
          <div
            ref={file.include ? dragHandle.setActivatorNodeRef : undefined}
            className={mergeClasses(
              'drag-handle flex items-center justify-center self-stretch px-1',
              file.include ? DRAG_HANDLE_GRAB_CURSOR : 'pointer-events-none cursor-default',
              file.include ? DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH : ''
            )}
            {...(file.include ? dragHandle.attributes : {})}
            {...(file.include ? dragHandle.listeners : {})}
          >
            <IconBtn
              borderless
              size="small"
              tabIndex={-1}
              ariaLabel=""
              className={mergeClasses(
                'pointer-events-none w-auto',
                file.include ? 'text-foreground-subdued hover:text-foreground' : 'text-foreground-subdued/40'
              )}
            >
              drag_handle
            </IconBtn>
          </div>
        </div>
      )}

      <div className={mergeClasses(TRACKS_COL_COMPACT_CELL, 'w-10 shrink-0 px-1 py-1 text-center text-sm [@media(pointer:coarse)]:py-2.5')}>
        {currentIndex ?? ''}
      </div>

      <div className={mergeClasses(TRACKS_COL_LG, 'w-12 shrink-0 px-4 text-center text-sm')}>{newIndex ?? ''}</div>

      <div className={mergeClasses(TRACKS_COL_LG, 'w-24 shrink-0 px-4 text-center text-sm')}>{currentIndex ?? ''}</div>
      {columnVisibility.trackFromFilename && (
        <div className={mergeClasses(TRACKS_COL_LG, 'w-32 shrink-0 px-2 text-center text-sm')}>{file.trackNumFromFilename ?? ''}</div>
      )}
      {columnVisibility.trackFromMetadata && (
        <div className={mergeClasses(TRACKS_COL_LG, 'w-32 shrink-0 text-center text-sm')}>{file.trackNumFromMeta ?? ''}</div>
      )}
      {columnVisibility.discFromFilename && (
        <div className={mergeClasses(TRACKS_COL_XL, 'w-20 shrink-0 truncate px-4 text-center text-sm')}>{file.discNumFromFilename ?? ''}</div>
      )}
      {columnVisibility.discFromMetadata && (
        <div className={mergeClasses(TRACKS_COL_XL, 'w-20 shrink-0 truncate px-4 text-center text-sm')}>{file.discNumFromMeta ?? ''}</div>
      )}

      <div className={mergeClasses(TRACKS_FILENAME_COLUMN_CLASS, 'px-2 py-1 lg:px-4 [@media(pointer:coarse)]:py-2.5')}>
        <TruncatingTooltipText lazy text={file.metadata.filename} className="text-sm" maxWidth={400} />
        {file.error && <div className="text-error mt-0.5 text-xs lg:hidden">{file.error}</div>}
      </div>

      <div className={mergeClasses(TRACKS_COL_LG, 'w-20 shrink-0 text-center font-mono text-xs')}>{bytesPretty(file.metadata.size)}</div>
      <div className={mergeClasses(TRACKS_COL_LG, 'w-20 shrink-0 text-center font-mono text-xs')}>{secondsToTimestamp(file.duration)}</div>

      {columnVisibility.notes && <div className={mergeClasses(TRACKS_COL_XL, 'w-56 shrink-0 px-2 font-sans text-xs font-normal')}>{file.error ?? ''}</div>}

      <div className="flex w-16 shrink-0 items-center justify-center self-stretch px-1 py-1 lg:w-28 lg:min-w-28 [@media(pointer:coarse)]:min-w-16">
        <ToggleSwitch
          value={file.include}
          offColor="error"
          size={primaryInputCanHover ? 'small' : 'medium'}
          onChange={(value) => onIncludeToggle(file.ino, value)}
        />
      </div>
    </div>
  )
}
