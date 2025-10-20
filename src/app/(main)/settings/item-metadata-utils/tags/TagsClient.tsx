'use client'

import type { EditListItem } from '@/components/ui/EditList'
import EditList from '@/components/ui/EditList'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useMemo } from 'react'

export default function TagsClient({ tags }: { tags: string[] }) {
  const { showToast } = useGlobalToast()

  const tagsList = useMemo(() => {
    return tags.map((tag) => ({
      id: tag,
      name: tag
    }))
  }, [tags])

  const handleDelete = async (item: EditListItem) => {
    console.log('handleDelete', item)
    showToast('Not implemented yet', { type: 'warning' })
  }

  const handleSave = async (tagToUpdate: EditListItem, newTagName: string) => {
    console.log('handleSave', tagToUpdate, newTagName)
    showToast('Not implemented yet', { type: 'warning' })
  }

  return (
    <div className="py-4">
      <EditList items={tagsList} onItemEditSaveClick={handleSave} onItemDeleteClick={handleDelete} listType="Tag" />
    </div>
  )
}
