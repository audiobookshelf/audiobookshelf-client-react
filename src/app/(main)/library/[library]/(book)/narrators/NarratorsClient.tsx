'use client'

import EditList, { EditListItem } from '@/components/ui/EditList'
import { NarratorObject } from '@/types/api'

export default function NarratorsClient({ narrators }: { narrators: NarratorObject[] }) {
  const handleSave = async (item: EditListItem, newName: string) => {
    console.log('save', item, newName)
    return Promise.resolve()
  }

  const handleDelete = async (item: EditListItem) => {
    console.log('delete', item)
  }

  return (
    <div>
      <EditList items={narrators} onItemEditSaveClick={handleSave} onItemDeleteClick={handleDelete} listType="Narrator" />
    </div>
  )
}
