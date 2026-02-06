'use client'

import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import SortableList from '@/components/widgets/SortableList'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { deleteLibrary } from './actions'
import LibrariesListRow from './LibrariesListRow'

interface LibrariesListProps {
  libraries: Library[]
  saveLibraryOrderAction: (reorderObjects: { id: string; newOrder: number }[]) => void
  onEditLibrary?: (library: Library) => void
}

export default function LibrariesList(props: LibrariesListProps) {
  const { libraries: librariesData, saveLibraryOrderAction, onEditLibrary } = props
  const t = useTypeSafeTranslations()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [libraries, setLibraries] = useState(librariesData || ([] as Library[]))
  const delRef = useRef<Library>(null)

  useEffect(() => {
    setLibraries(librariesData)
  }, [librariesData])

  const handleSortChange = (sortedItems: Library[]) => {
    setLibraries(sortedItems as Library[])
    startTransition(async () => {
      saveLibraryOrderAction(sortedItems.map((item, index) => ({ id: item.id, newOrder: index })))
    })
  }

  const handleEditLibrary = useCallback(
    (library: Library) => {
      onEditLibrary?.(library)
    },
    [onEditLibrary]
  )

  const handleDeleteLibrary = useCallback((item: Library) => {
    delRef.current = item
    setShowConfirmDialog(true)
  }, [])

  const handleConfirmDeleteLibrary = useCallback(async () => {
    if (!delRef.current) return
    setShowConfirmDialog(false)

    const updatedLibraries = libraries.filter((lib) => lib.id !== delRef.current?.id)
    setLibraries(updatedLibraries)
    try {
      await deleteLibrary(delRef.current?.id)
      showToast(t('ToastLibraryDeleteSuccess'), { type: 'success' })
    } catch (error) {
      // Revert UI on error
      setLibraries(libraries)
      showToast(t('ToastLibraryDeleteFailed'), { type: 'error' })
      console.error('Failed to delete library:', error)
    } finally {
      delRef.current = null
    }
  }, [libraries, showToast, t])

  return (
    <div>
      <SortableList
        items={libraries}
        itemClassName="first:rounded-t-md last:rounded-b-md border border-border"
        disabled={isPending}
        onSortEnd={handleSortChange}
        renderItem={(item: Library) => {
          return <LibrariesListRow item={item} key={item.id} handleDeleteLibrary={handleDeleteLibrary} handleEditLibrary={handleEditLibrary} />
        }}
        dragHandle=".drag-handle"
      />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={t('MessageConfirmDeleteLibrary', { 0: delRef.current?.name || '' })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-white"
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDeleteLibrary}
      />
    </div>
  )
}
