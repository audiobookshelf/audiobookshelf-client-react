'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { useBookshelfSelection } from '@/contexts/BookshelfSelectionContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

export default function AppBarSelectionOverlay() {
  const t = useTypeSafeTranslations()
  const { selectedItems, clearSelection } = useBookshelfSelection()

  if (selectedItems.length === 0) {
    return null
  }

  return (
    <div
      className="bg-primary absolute inset-0 z-70 flex items-center px-4 md:px-6"
      role="toolbar"
      aria-label={t('MessageItemsSelected', { 0: selectedItems.length })}
    >
      <h1 className="px-4 text-lg md:text-2xl">{t('MessageItemsSelected', { 0: selectedItems.length })}</h1>
      <div className="grow" />
      {/* TODO: batch actions (play, mark finished, add to collection, batch edit, delete) */}
      <Tooltip text={t('LabelDeselectAll')} position="bottom">
        <IconBtn borderless ariaLabel={t('LabelDeselectAll')} onClick={clearSelection} className="text-3xl">
          close
        </IconBtn>
      </Tooltip>
    </div>
  )
}
