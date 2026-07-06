'use client'

import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import type { TracksListColumnVisibility } from '@/components/widgets/tracks-edit/tracksListColumns'
import type { TrackSortKey } from '@/hooks/useTrackEditor'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useMemo } from 'react'

interface TracksEditActionsProps {
  hasChanges: boolean
  isPending: boolean
  onReset: () => void
  onSave: () => void
  className?: string
}

interface TracksEditToolbarProps {
  currentSort: TrackSortKey
  columnVisibility?: TracksListColumnVisibility
  onSort: (sortKey: TrackSortKey) => void
}

const MOBILE_SORT_OPTIONS: {
  value: Exclude<TrackSortKey, 'custom'>
  labelKey: 'LabelTrackOrder' | 'LabelTrackFromFilename' | 'LabelTrackFromMetadata' | 'LabelDiscFromFilename' | 'LabelDiscFromMetadata' | 'LabelFilename'
}[] = [
  { value: 'current', labelKey: 'LabelTrackOrder' },
  { value: 'track-filename', labelKey: 'LabelTrackFromFilename' },
  { value: 'metadata', labelKey: 'LabelTrackFromMetadata' },
  { value: 'disc-filename', labelKey: 'LabelDiscFromFilename' },
  { value: 'disc-metadata', labelKey: 'LabelDiscFromMetadata' },
  { value: 'filename', labelKey: 'LabelFilename' }
]

export function TracksEditActions({ hasChanges, isPending, onReset, onSave, className }: TracksEditActionsProps) {
  const t = useTypeSafeTranslations()

  if (!hasChanges) {
    return null
  }

  return (
    <div className={mergeClasses('flex shrink-0 items-center justify-end gap-2', className)}>
      <Btn size="small" className="w-auto" disabled={isPending} onClick={onReset}>
        {t('ButtonReset')}
      </Btn>
      <Btn color="bg-success" size="small" className="w-auto" loading={isPending} disabled={isPending} onClick={onSave}>
        {t('ButtonSaveTracklist')}
      </Btn>
    </div>
  )
}

export default function TracksEditToolbar({ currentSort, columnVisibility, onSort }: TracksEditToolbarProps) {
  const t = useTypeSafeTranslations()

  const mobileSortOptions = useMemo(() => {
    if (!columnVisibility) return MOBILE_SORT_OPTIONS
    return MOBILE_SORT_OPTIONS.filter((opt) => {
      if (opt.value === 'disc-filename') return columnVisibility.discFromFilename
      if (opt.value === 'disc-metadata') return columnVisibility.discFromMetadata
      return true
    })
  }, [columnVisibility])

  const sortDropdownItems = mobileSortOptions.map((opt) => ({
    text: t(opt.labelKey),
    value: opt.value
  }))

  const isCustomOrder = currentSort === 'custom'
  const activeSortValue = isCustomOrder ? 'current' : currentSort
  const activeSortLabel = isCustomOrder ? t('LabelCustomTrackOrder') : t(mobileSortOptions.find((o) => o.value === currentSort)?.labelKey ?? 'LabelTrackOrder')

  return (
    <Dropdown
      size="small"
      className="w-full lg:hidden"
      label={t('LabelSortBy')}
      value={activeSortValue}
      items={sortDropdownItems}
      displayText={activeSortLabel}
      highlightSelected={!isCustomOrder}
      onChange={(value) => onSort(value as TrackSortKey)}
    />
  )
}
