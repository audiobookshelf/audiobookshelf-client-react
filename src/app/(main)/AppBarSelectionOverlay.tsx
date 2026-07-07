'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { useBookshelfSelection } from '@/contexts/BookshelfSelectionContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getSelectionCountMessageKey } from '@/lib/selectedMediaItem'

export default function AppBarSelectionOverlay() {
  const t = useTypeSafeTranslations()
  const { selectedItems, selectionKind, clearSelection } = useBookshelfSelection()

  if (selectedItems.length === 0 || selectionKind === null) {
    return null
  }

  const selectionLabel = t(getSelectionCountMessageKey(selectionKind), { count: selectedItems.length })

  return (
    <div
      className="bg-primary absolute inset-0 z-70 flex items-center px-4 md:px-6"
      role="toolbar"
      aria-label={selectionLabel}
    >
      <h1 className="px-4 text-lg md:text-2xl">{selectionLabel}</h1>
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
