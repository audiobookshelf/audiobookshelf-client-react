'use client'

import type { EditListItem } from '@/components/ui/EditList'
import EditList from '@/components/ui/EditList'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useMemo } from 'react'

export default function GenresClient({ genres }: { genres: string[] }) {
  const { showToast } = useGlobalToast()

  const genresList = useMemo(() => {
    return genres.map((genre) => ({
      id: genre,
      name: genre
    }))
  }, [genres])

  const handleDelete = async (item: EditListItem) => {
    console.log('handleDelete', item)
    showToast('Not implemented yet', { type: 'warning' })
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
