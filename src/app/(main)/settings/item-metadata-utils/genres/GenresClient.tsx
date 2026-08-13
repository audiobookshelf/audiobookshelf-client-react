'use client'

import MetadataEditTable, { MetadataEditTableItem } from '@/components/ui/MetadataEditTable'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useMemo, useTransition } from 'react'
import { removeGenre, renameGenre } from './actions'

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

  const handleDelete = async (item: MetadataEditTableItem) => {
    if (isPending) return
    startTransition(async () => {
      const response = await removeGenre(item.name)

      if (response?.numItemsUpdated) {
        const numItemsUpdated = response.numItemsUpdated || 0
        showToast(t('MessageItemsUpdated', { 0: numItemsUpdated.toString() }), { type: 'success' })
      }
    })
  }

  const handleSave = async (genreToUpdate: MetadataEditTableItem, newGenreName: string) => {
    if (isPending) return
    startTransition(async () => {
      const response = await renameGenre(genreToUpdate.name, newGenreName)

      if (response?.numItemsUpdated) {
        const numItemsUpdated = response.numItemsUpdated || 0
        showToast(t('MessageItemsUpdated', { 0: numItemsUpdated.toString() }), { type: 'success' })
      }
    })
  }

  return (
    <div className="py-4">
      <MetadataEditTable items={genresList} onItemEditSaveClick={handleSave} onItemDeleteClick={handleDelete} listType="Genre" />
    </div>
  )
}
