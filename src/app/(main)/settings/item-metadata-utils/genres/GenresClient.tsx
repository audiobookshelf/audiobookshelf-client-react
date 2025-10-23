'use client'

import type { EditListItem } from '@/components/ui/EditList'
import EditList from '@/components/ui/EditList'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useMemo, useTransition } from 'react'
import { removeGenre } from './actions'

export default function GenresClient({ genres }: { genres: string[] }) {
  const { showToast } = useGlobalToast()
  const t = useTypeSafeTranslations()
  const [isPending, startTransition] = useTransition()

  const genresList = useMemo(() => {
    return genres.map((genre) => ({
      id: genre,
      name: genre
    }))
  }, [genres])

  const handleDelete = async (item: EditListItem) => {
    if (isPending) return
    startTransition(async () => {
      const response = await removeGenre(item.name)

      if (response.error) {
        console.error('Error removing genre', response.error)
        showToast(t('ToastRemoveFailed'), { type: 'error' })
      } else if (response.data) {
        // TODO: Support pluralization
        const numItemsUpdated = response.data.numItemsUpdated || 0
        showToast(t('MessageItemsUpdated', { 0: numItemsUpdated.toString() }), { type: 'success' })
      }
    })
  }

  const handleSave = async (genreToUpdate: EditListItem, newGenreName: string) => {
    console.log('handleSave', genreToUpdate, newGenreName)
    showToast('Not implemented yet', { type: 'warning' })
  }

  return (
    <div className="py-4">
      <EditList items={genresList} onItemEditSaveClick={handleSave} onItemDeleteClick={handleDelete} listType="Genre" />
    </div>
  )
}
