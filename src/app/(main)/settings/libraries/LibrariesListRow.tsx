'use client'

import Btn from '@/components/ui/Btn'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import LibraryIcon from '@/components/ui/LibraryIcon'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import type { SortableListDragHandleProps } from '@/components/widgets/SortableList'
import { useTasks } from '@/contexts/TasksContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH, DRAG_HANDLE_GRAB_CURSOR } from '@/lib/dragHandleClasses'
import { mergeClasses } from '@/lib/merge-classes'
import { Library } from '@/types/api'
import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import { matchAll, requestScanLibrary } from './actions'

interface LibrariesListRowProps {
  item: Library
  handleDeleteLibrary: (library: Library) => void
  handleEditLibrary: (library: Library) => void
  sortableDragHandleProps?: SortableListDragHandleProps
}

export default function LibrariesListRow({ item, handleDeleteLibrary, handleEditLibrary, sortableDragHandleProps }: LibrariesListRowProps) {
  const t = useTypeSafeTranslations()
  const { getTasksByLibraryId } = useTasks()

  const libraryTasks = useMemo(() => getTasksByLibraryId(item.id), [getTasksByLibraryId, item.id])

  const isLibraryTaskRunning = useMemo(() => {
    return libraryTasks.find((task) => (task.action === 'library-scan' || task.action === 'library-match-all') && !task.isFinished)
  }, [libraryTasks])

  const contextMenuItems: ContextMenuDropdownItem[] = [
    { text: t('ButtonEdit'), action: 'edit' },
    { text: t('ButtonScan'), action: 'scan' },
    { text: t('ButtonDelete'), action: 'delete' }
  ]

  if (item.mediaType === 'book') {
    contextMenuItems.splice(2, 0, { text: t('ButtonMatchBooks'), action: 'matchBooks' })
  }

  const handleScanLibrary = useCallback(() => {
    try {
      requestScanLibrary(item.id)
    } catch (error) {
      console.error('Failed to start scan', error)
    }
  }, [item.id])

  const handleMatchBooks = useCallback(() => {
    try {
      matchAll(item.id)
    } catch (error) {
      console.error('Failed to start matching', error)
    }
  }, [item.id])

  const handleContextMenuActions = useCallback(
    (params: { action: string; data?: Record<string, string> }) => {
      switch (params.action) {
        case 'edit':
          handleEditLibrary(item)
          break
        case 'delete':
          handleDeleteLibrary(item)
          break
        case 'scan':
          handleScanLibrary()
          break
        case 'matchBooks':
          handleMatchBooks()
          break
      }
    },
    [handleDeleteLibrary, handleEditLibrary, handleMatchBooks, handleScanLibrary, item]
  )

  return (
    <div className="hover:bg-primary/20 text-foreground/50 hover:text-foreground flex items-center gap-4 px-4 py-1">
      {isLibraryTaskRunning ? <LoadingSpinner /> : <LibraryIcon icon={item.icon} />}
      <Link className="text-foreground py-2 hover:underline" href={`/library/${item.id}`}>
        {item.name}
      </Link>
      <div className="grow" />
      {!isLibraryTaskRunning && (
        <>
          <Btn color="bg-bg" className="h-auto px-3 text-xs" size="small" onClick={handleScanLibrary} disabled={isLibraryTaskRunning}>
            {t('ButtonScan')}
          </Btn>
          <ContextMenuDropdown usePortal borderless size="small" items={contextMenuItems} onAction={handleContextMenuActions} />
        </>
      )}
      <div
        ref={sortableDragHandleProps?.setActivatorNodeRef}
        className={mergeClasses('drag-handle flex shrink-0 items-center justify-center', DRAG_HANDLE_GRAB_CURSOR, DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH)}
        {...sortableDragHandleProps?.attributes}
        {...sortableDragHandleProps?.listeners}
      >
        <span className="material-symbols text-foreground/50 hover:text-foreground text-xl leading-none">drag_handle</span>
      </div>
    </div>
  )
}
