'use client'

import type { EditListItem } from '@/components/ui/EditList'
import EditList from '@/components/ui/EditList'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { NarratorObject } from '@/types/api'
import { useTransition } from 'react'
import { deleteNarrator, saveNarrator } from './actions'

export default function NarratorsClient({ libraryId, narrators }: { libraryId: string; narrators: NarratorObject[] }) {
  const { showToast } = useGlobalToast()
  const t = useTypeSafeTranslations()
  const [isPending, startTransition] = useTransition()

  const handleSave = async (item: EditListItem, newName: string) => {
    if (isPending) return

    startTransition(async () => {
      const response = await saveNarrator(libraryId, item.id, newName)

      if (response?.updated !== undefined) {
        const numItemsUpdated = response.updated || 0
        showToast(t('MessageItemsUpdated', { 0: numItemsUpdated.toString() }), { type: 'success' })
      }
    })
  }

  const handleDelete = async (item: EditListItem) => {
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
    <div>
      <EditList libraryId={libraryId} items={narrators} onItemEditSaveClick={handleSave} onItemDeleteClick={handleDelete} listType="Narrator" />
    </div>
  )
}
