'use client'

import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useCallback, useEffect, useMemo } from 'react'

interface LibrarySortSelectProps {
  isSeries?: boolean
  libraryMediaType?: 'book' | 'podcast'
}

// Default sort that works for both book and podcast libraries
const DEFAULT_SORT = 'media.metadata.title'

export default function LibrarySortSelect({ isSeries = false, libraryMediaType = 'book' }: LibrarySortSelectProps) {
  const { orderBy, orderDesc, seriesSortBy, seriesSortDesc, filterBy, updateSetting } = useLibrary()
  const t = useTypeSafeTranslations()

  const isPodcast = libraryMediaType === 'podcast'
  const isFilteredBySeries = filterBy?.startsWith('series.') ?? false

  const currentSortBy = isSeries ? seriesSortBy : orderBy
  const currentSortDesc = isSeries ? seriesSortDesc : orderDesc

  const defaultsToAsc = useCallback((val: string) => {
    return ['media.metadata.title', 'media.metadata.author', 'media.metadata.authorName', 'media.metadata.authorNameLF', 'sequence', 'name'].includes(val)
  }, [])

  const handleSortChange = useCallback(
    (value: string | number) => {
      const val = String(value)
      if (currentSortBy === val) {
        // Toggle direction
        updateSetting(isSeries ? 'seriesSortDesc' : 'orderDesc', !currentSortDesc)
      } else {
        // New sort
        updateSetting(isSeries ? 'seriesSortBy' : 'orderBy', val)
        if (defaultsToAsc(val)) {
          updateSetting(isSeries ? 'seriesSortDesc' : 'orderDesc', false)
        }
      }
    },
    [currentSortBy, currentSortDesc, isSeries, updateSetting, defaultsToAsc]
  )

  // Podcast sort items (matching Vue podcastItems)
  const podcastItems = useMemo(
    (): DropdownItem[] => [
      { text: t('LabelTitle'), value: 'media.metadata.title' },
      { text: t('LabelAuthor'), value: 'media.metadata.author' },
      { text: t('LabelAddedAt'), value: 'addedAt' },
      { text: t('LabelSize'), value: 'size' },
      { text: t('LabelNumberOfEpisodes'), value: 'media.numTracks' },
      { text: t('LabelFileBirthtime'), value: 'birthtimeMs' },
      { text: t('LabelFileModified'), value: 'mtimeMs' },
      { text: t('LabelRandomly'), value: 'random' }
    ],
    [t]
  )

  // Book sort items (matching Vue bookItems)
  const bookItems = useMemo(
    (): DropdownItem[] => [
      { text: t('LabelTitle'), value: 'media.metadata.title' },
      { text: t('LabelAuthorFirstLast'), value: 'media.metadata.authorName' },
      { text: t('LabelAuthorLastFirst'), value: 'media.metadata.authorNameLF' },
      { text: t('LabelPublishYear'), value: 'media.metadata.publishedYear' },
      { text: t('LabelAddedAt'), value: 'addedAt' },
      { text: t('LabelSize'), value: 'size' },
      { text: t('LabelDuration'), value: 'media.duration' },
      { text: t('LabelFileBirthtime'), value: 'birthtimeMs' },
      { text: t('LabelFileModified'), value: 'mtimeMs' },
      { text: t('LabelLibrarySortByProgress'), value: 'progress' },
      { text: t('LabelLibrarySortByProgressStarted'), value: 'progress.createdAt' },
      { text: t('LabelLibrarySortByProgressFinished'), value: 'progress.finishedAt' },
      { text: t('LabelRandomly'), value: 'random' }
    ],
    [t]
  )

  // Series sort items (bookItems + sequence, matching Vue seriesItems)
  const seriesItems = useMemo((): DropdownItem[] => [...bookItems, { text: t('LabelSequence'), value: 'sequence' }], [bookItems, t])

  // Series page sort items (for isSeries=true prop, different from filtering by series)
  const seriesPageItems = useMemo(
    (): DropdownItem[] => [
      { text: t('LabelName'), value: 'name' },
      { text: t('LabelNumberOfBooks'), value: 'numBooks' },
      { text: t('LabelAddedAt'), value: 'addedAt' },
      { text: t('LabelLastBookAdded'), value: 'lastBookAdded' },
      { text: t('LabelLastBookUpdated'), value: 'lastBookUpdated' },
      { text: t('LabelTotalDuration'), value: 'totalDuration' },
      { text: t('LabelRandomly'), value: 'random' }
    ],
    [t]
  )

  // Get the available items based on current context (without sort icons)
  const availableItems = useMemo(() => {
    if (isSeries) return seriesPageItems
    if (isPodcast) return podcastItems
    if (isFilteredBySeries) return seriesItems
    return bookItems
  }, [isSeries, isPodcast, isFilteredBySeries, seriesPageItems, podcastItems, seriesItems, bookItems])

  // Auto-reset sort to a valid value when current sort doesn't exist in available items
  // This handles switching between library types with incompatible sort keys
  useEffect(() => {
    const isValidSort = availableItems.some((item) => item.value === currentSortBy)
    if (currentSortBy && !isValidSort) {
      updateSetting(isSeries ? 'seriesSortBy' : 'orderBy', DEFAULT_SORT)
    }
  }, [availableItems, currentSortBy, isSeries, updateSetting])

  const sortItems = useMemo(() => {
    // Clone items to avoid mutating the memoized arrays
    const items = availableItems.map((item) => ({ ...item }))

    // Add sort direction arrow to the selected sort item
    if (currentSortBy) {
      const selectedItem = items.find((i) => i.value === currentSortBy)
      if (selectedItem) {
        selectedItem.rightIcon = (
          <span className="material-symbols text-xl text-yellow-400" aria-label={currentSortDesc ? t('LabelSortDescending') : t('LabelSortAscending')}>
            {currentSortDesc ? 'expand_more' : 'expand_less'}
          </span>
        )
      }
    }

    return items
  }, [t, availableItems, currentSortBy, currentSortDesc])

  const rightIcon = useMemo(() => {
    return (
      <span className="material-symbols text-lg text-yellow-400" aria-label={currentSortDesc ? t('LabelSortDescending') : t('LabelSortAscending')}>
        {currentSortDesc ? 'expand_more' : 'expand_less'}
      </span>
    )
  }, [currentSortDesc, t])

  return (
    <div className="w-36 sm:w-44 md:w-48 h-9">
      <Dropdown
        value={currentSortBy}
        items={sortItems}
        onChange={handleSortChange}
        size="auto"
        rightIcon={rightIcon}
        className="h-full text-xs"
        highlightSelected={true}
        menuMaxHeight="none"
      />
    </div>
  )
}
