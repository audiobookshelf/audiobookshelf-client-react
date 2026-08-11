'use client'

import MetadataEditTable, { MetadataEditTableItem } from '@/components/ui/MetadataEditTable'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useMemo, useTransition } from 'react'
import { removeTag, renameTag } from './actions'

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

  const handleDelete = async (item: MetadataEditTableItem) => {
    if (isPending) return

    startTransition(async () => {
      const response = await removeTag(item.name)

      if (response?.numItemsUpdated) {
        const numItemsUpdated = response.numItemsUpdated || 0
        showToast(t('MessageItemsUpdated', { 0: numItemsUpdated.toString() }), { type: 'success' })
      }
    })
  }

  const handleSave = async (tagToUpdate: MetadataEditTableItem, newTagName: string) => {
    if (isPending) return
    startTransition(async () => {
      const response = await renameTag(tagToUpdate.name, newTagName)

      if (response?.numItemsUpdated) {
        const numItemsUpdated = response.numItemsUpdated || 0
        showToast(t('MessageItemsUpdated', { 0: numItemsUpdated.toString() }), { type: 'success' })
      }
    })
  }

  return (
    <div className="py-4">
      <MetadataEditTable items={tagsList} onItemEditSaveClick={handleSave} onItemDeleteClick={handleDelete} listType="Tag" />
    </div>
  )
}
