'use client'

import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { TrackSortKey } from '@/hooks/useTrackEditor'
import { mergeClasses } from '@/lib/merge-classes'

interface TracksEditActionsProps {
  hasChanges: boolean
  isPending: boolean
  onReset: () => void
  onSave: () => void
  className?: string
  /** When false, omit the actions entirely instead of reserving space while hidden. */
  reserveSpace?: boolean
}

interface TracksEditToolbarProps {
  currentSort: TrackSortKey
  onSort: (sortKey: TrackSortKey) => void
}

const MOBILE_SORT_OPTIONS: { value: Exclude<TrackSortKey, 'custom'>; labelKey: 'LabelTrackOrder' | 'LabelTrackFromFilename' | 'LabelTrackFromMetadata' | 'LabelFilename' }[] = [
  { value: 'current', labelKey: 'LabelTrackOrder' },
  { value: 'track-filename', labelKey: 'LabelTrackFromFilename' },
  { value: 'metadata', labelKey: 'LabelTrackFromMetadata' },
  { value: 'filename', labelKey: 'LabelFilename' }
]

export function TracksEditActions({
  hasChanges,
  isPending,
  onReset,
  onSave,
  className,
  reserveSpace = true
}: TracksEditActionsProps) {
  const t = useTypeSafeTranslations()

  if (!hasChanges && !reserveSpace) {
    return null
  }

  return (
    <div
      className={mergeClasses(
        'flex shrink-0 items-center justify-end gap-2',
        reserveSpace && 'min-h-9',
        !hasChanges && reserveSpace && 'invisible pointer-events-none',
        className
      )}
      aria-hidden={!hasChanges}
    >
      <Btn
        size="small"
        className="w-auto"
        disabled={isPending}
        tabIndex={!hasChanges ? -1 : undefined}
        onClick={onReset}
      >
        {t('ButtonReset')}
      </Btn>
      <Btn
        color="bg-success"
        size="small"
        className="w-auto"
        loading={isPending}
        disabled={isPending}
        tabIndex={!hasChanges ? -1 : undefined}
        onClick={onSave}
      >
        {t('ButtonSaveTracklist')}
      </Btn>
    </div>
  )
}

export default function TracksEditToolbar({ currentSort, onSort }: TracksEditToolbarProps) {
  const t = useTypeSafeTranslations()

  const sortDropdownItems = MOBILE_SORT_OPTIONS.map((opt) => ({
    text: t(opt.labelKey),
    value: opt.value
  }))

  const isCustomOrder = currentSort === 'custom'
  const activeSortValue = isCustomOrder ? 'current' : currentSort
  const activeSortLabel = isCustomOrder
    ? t('LabelCustomTrackOrder')
    : t(MOBILE_SORT_OPTIONS.find((o) => o.value === currentSort)?.labelKey ?? 'LabelTrackOrder')

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
