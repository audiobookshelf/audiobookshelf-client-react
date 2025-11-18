'use client'

import Btn from '@/components/ui/Btn'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import LibraryIcon from '@/components/ui/LibraryIcon'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { useTasks } from '@/contexts/TasksContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import { requestScanLibrary } from './actions'

interface LibrariesListRowProps {
  item: Library
  handleDeleteLibrary: (library: Library) => void
  handleEditLibrary: (library: Library) => void
}

export default function LibrariesListRow({ item, handleDeleteLibrary, handleEditLibrary }: LibrariesListRowProps) {
  const t = useTypeSafeTranslations()
  const { getTasksByLibraryId } = useTasks()

  const libraryTasks = useMemo(() => getTasksByLibraryId(item.id), [getTasksByLibraryId, item.id])

  const libraryTask = useMemo(() => {
    return libraryTasks.find((task) => task.action === 'library-scan' || task.action === 'library-match-all')
  }, [libraryTasks])

  const isLibraryTaskRunning = useMemo(() => {
    return libraryTask && !libraryTask.isFinished
  }, [libraryTask])

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
    console.error('Match All Books Not Implemented')
  }, [])

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
  console.log('Rendering LibrariesListRow for library:', item.id, 'Is task running:', isLibraryTaskRunning)

  return (
    <div className="flex items-center gap-4 py-1 px-4 hover:bg-primary/20 text-foreground/50 hover:text-foreground">
      {isLibraryTaskRunning ? <LoadingSpinner /> : <LibraryIcon icon={item.icon} />}
      <Link className="py-2 text-foreground hover:underline" href={`/library/${item.id}`}>
        {item.name}
      </Link>
      <div className="grow" />
      {!isLibraryTaskRunning && (
        <>
          <Btn color="bg-bg" className="h-auto px-3 text-xs" size="small" onClick={handleScanLibrary} disabled={isLibraryTaskRunning}>
            {t('ButtonScan')}
          </Btn>
          <ContextMenuDropdown borderless size="small" items={contextMenuItems} onAction={handleContextMenuActions} />
        </>
      )}
      <div className="drag-handle cursor-n-resize">
        <span className="material-symbols text-xl text-foreground/50 hover:text-foreground">reorder</span>
      </div>
    </div>
  )
}
