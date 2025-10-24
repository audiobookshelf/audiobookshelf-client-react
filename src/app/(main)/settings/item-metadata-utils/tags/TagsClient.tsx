'use client'

import type { EditListItem } from '@/components/ui/EditList'
import EditList from '@/components/ui/EditList'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useMemo, useTransition } from 'react'
import { removeTag } from './actions'

export default function TagsClient({ tags }: { tags: string[] }) {
  const { showToast } = useGlobalToast()
  const t = useTypeSafeTranslations()
  const [isPending, startTransition] = useTransition()

  const tagsList = useMemo(() => {
    return tags.map((tag) => ({
      id: tag,
      name: tag
    }))
  }, [tags])

  const handleDelete = async (item: EditListItem) => {
    if (isPending) return

    startTransition(async () => {
      const response = await removeTag(item.name)

      if (response?.numItemsUpdated) {
        // TODO: Support pluralization
        const numItemsUpdated = response.numItemsUpdated || 0
        showToast(t('MessageItemsUpdated', { 0: numItemsUpdated.toString() }), { type: 'success' })
      }
    })
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
