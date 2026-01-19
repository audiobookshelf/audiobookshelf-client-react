'use client'

import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useMemo } from 'react'

interface EpisodesSortSelectProps {
  sortBy: string
  sortDesc: boolean
  onChange: (sortBy: string, sortDesc: boolean) => void
  disabled?: boolean
  className?: string
}

export default function EpisodesSortSelect({ sortBy, sortDesc, onChange, disabled, className }: EpisodesSortSelectProps) {
  const t = useTypeSafeTranslations()

  const sortItems = useMemo<DropdownItem[]>(
    () => [
      { text: t('LabelPubDate'), value: 'publishedAt' },
      { text: t('LabelTitle'), value: 'title' },
      { text: t('LabelSeason'), value: 'season' },
      { text: t('LabelEpisode'), value: 'episode' },
      { text: t('LabelFilename'), value: 'audioFile.metadata.filename' }
    ],
    [t]
  )

  // Process items to add the sort arrow to the selected one
  const displayItems = useMemo(() => {
    return sortItems.map((item) => {
      if (item.value === sortBy) {
        return {
          ...item,
          rightIcon: (
            <span className="material-symbols text-xl text-yellow-400" aria-label={sortDesc ? t('LabelSortDescending') : t('LabelSortAscending')}>
              {sortDesc ? 'expand_more' : 'expand_less'}
            </span>
          )
        }
      }
      return item
    })
  }, [sortItems, sortBy, sortDesc, t])

  const handleSortChange = (newSortBy: string | number) => {
    const val = String(newSortBy)
    if (val === sortBy) {
      // Toggle direction
      onChange(val, !sortDesc)
    } else {
      // Default to descending for publishedAt, ascending for others
      const defaultDesc = val === 'publishedAt'
      onChange(val, defaultDesc)
    }
  }

  const rightIcon = (
    <span className="material-symbols text-lg text-yellow-400" aria-label={sortDesc ? t('LabelSortDescending') : t('LabelSortAscending')}>
      {sortDesc ? 'expand_more' : 'expand_less'}
    </span>
  )

  return (
    <div className={className}>
      <Dropdown
        value={sortBy}
        items={displayItems}
        onChange={handleSortChange}
        size="auto"
        rightIcon={rightIcon}
        className="h-9 text-xs"
        highlightSelected={true}
        menuMaxHeight="none"
        disabled={disabled}
      />
    </div>
  )
}
