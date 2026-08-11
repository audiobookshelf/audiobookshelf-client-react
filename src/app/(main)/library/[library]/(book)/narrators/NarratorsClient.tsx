'use client'

import MetadataEditTable, { MetadataEditTableItem } from '@/components/ui/MetadataEditTable'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { NarratorObject } from '@/types/api'
import { useEffect, useTransition } from 'react'
import { deleteNarrator, saveNarrator } from './actions'

export default function NarratorsClient({ libraryId, narrators }: { libraryId: string; narrators: NarratorObject[] }) {
  const { showToast } = useGlobalToast()
  const { setItemCount } = useLibrary()
  const t = useTypeSafeTranslations()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setItemCount(narrators.length)
    return () => {
      setItemCount(null)
    }
  }, [narrators.length, setItemCount])

  const handleSave = async (item: MetadataEditTableItem, newName: string) => {
    if (isPending) return

    startTransition(async () => {
      const response = await saveNarrator(libraryId, item.id, newName)

      if (response?.updated !== undefined) {
        const numItemsUpdated = response.updated || 0
        showToast(t('MessageItemsUpdated', { 0: numItemsUpdated.toString() }), { type: 'success' })
      }
    })
  }

  const handleDelete = async (item: MetadataEditTableItem) => {
    if (isPending) return

    startTransition(async () => {
      const response = await deleteNarrator(libraryId, item.id)

      if (response?.updated !== undefined) {
        const numItemsUpdated = response.updated || 0
        showToast(t('MessageItemsUpdated', { 0: numItemsUpdated.toString() }), { type: 'success' })
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <MetadataEditTable libraryId={libraryId} items={narrators} onItemEditSaveClick={handleSave} onItemDeleteClick={handleDelete} listType="Narrator" />
    </div>
  )
}
