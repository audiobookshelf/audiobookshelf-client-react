'use client'

import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { filterDecode, filterEncode } from '@/lib/filterUtils'
import { EntityType, User } from '@/types/api'
import { useCallback, useMemo } from 'react'

interface LibraryFilterSelectProps {
  entityType?: EntityType
  user?: User
}

export default function LibraryFilterSelect({ entityType = 'items', user }: LibraryFilterSelectProps) {
  const { filterBy, updateSetting, seriesFilterBy, library, filterData } = useLibrary()
  const t = useTypeSafeTranslations()

  const isSeries = entityType === 'series'
  const currentFilter = isSeries ? seriesFilterBy : filterBy
  const isBook = library?.mediaType === 'book'

  /**
   * Get the display text for the current filter value
   */
  const getSelectedText = useCallback(() => {
    if (currentFilter === 'all') return t('LabelAll')

    // Check for filter types with encoded values
    if (currentFilter.includes('.')) {
      const [type, ...rest] = currentFilter.split('.')
      const encodedValue = rest.join('.')

      // Progress filters
      if (type === 'progress') {
        try {
          const decodedValue = filterDecode(encodedValue)
          const progressLabels: Record<string, string> = {
            finished: t('LabelFinished'),
            'in-progress': t('LabelInProgress'),
            'not-started': t('LabelNotStarted'),
            'not-finished': t('LabelNotFinished')
          }
          return progressLabels[decodedValue] || currentFilter
        } catch {
          return currentFilter
        }
      }

      // Missing filters
      if (type === 'missing') {
        try {
          const decodedValue = filterDecode(encodedValue)
          const missingLabels: Record<string, string> = {
            asin: 'ASIN',
            isbn: 'ISBN',
            authors: t('LabelAuthor'),
            chapters: t('LabelChapters'),
            cover: t('LabelCover'),
            description: t('LabelDescription'),
            genres: t('LabelGenre'),
            language: t('LabelLanguage'),
            narrators: t('LabelNarrator'),
            publishedYear: t('LabelPublishYear'),
            publisher: t('LabelPublisher'),
            series: t('LabelSeries'),
            subtitle: t('LabelSubtitle'),
            tags: t('LabelTags')
          }
          const label = missingLabels[decodedValue] || decodedValue
          return `${t('LabelMissing')}: ${label}`
        } catch {
          return currentFilter
        }
      }

      // Tracks filters
      if (type === 'tracks') {
        try {
          const decodedValue = filterDecode(encodedValue)
          const trackLabels: Record<string, string> = {
            none: t('LabelTracksNone'),
            single: t('LabelTracksSingleTrack'),
            multi: t('LabelTracksMultiTrack')
          }
          return trackLabels[decodedValue] || currentFilter
        } catch {
          return currentFilter
        }
      }

      // Ebooks filters
      if (type === 'ebooks') {
        try {
          const decodedValue = filterDecode(encodedValue)
          const ebookLabels: Record<string, string> = {
            ebook: t('LabelHasEbook'),
            'no-supplementary': t('LabelMissingSupplementaryEbook'),
            supplementary: t('LabelHasSupplementaryEbook'),
            'no-ebook': t('LabelMissingEbook')
          }
          return ebookLabels[decodedValue] || currentFilter
        } catch {
          return currentFilter
        }
      }

      // Series filter - look up name from filterData
      if (type === 'series') {
        try {
          const decodedId = filterDecode(encodedValue)
          if (decodedId === 'no-series') {
            return t('MessageNoSeries')
          }
          const series = filterData?.series?.find((s) => s.id === decodedId)
          if (series) {
            return `${t('LabelSeries')}: ${series.name}`
          }
        } catch {
          // Fall through to default handling
        }
      }

      // Authors filter - look up name from filterData
      if (type === 'authors') {
        try {
          const decodedId = filterDecode(encodedValue)
          const author = filterData?.authors?.find((a) => a.id === decodedId)
          if (author) {
            return `${t('LabelAuthor')}: ${author.name}`
          }
        } catch {
          // Fall through to default handling
        }
      }

      // Decode dynamic filter values (for genres, tags, narrators, publishers, etc.)
      try {
        const decodedValue = filterDecode(encodedValue)
        const prefix = type.charAt(0).toUpperCase() + type.slice(1, -1)
        return `${prefix}: ${decodedValue}`
      } catch {
        return currentFilter
      }
    }

    // Simple filters
    const simpleLabels: Record<string, string> = {
      abridged: t('LabelAbridged'),
      issues: t('ButtonIssues'),
      'feed-open': t('LabelRSSFeedOpen'),
      explicit: t('LabelExplicit'),
      'share-open': t('LabelShareOpen')
    }
    return simpleLabels[currentFilter] || currentFilter
  }, [currentFilter, t, filterData])

  const handleFilterChange = useCallback(
    (val: string | number) => {
      const value = String(val)
      if (isSeries) {
        updateSetting('seriesFilterBy', value)
      } else {
        updateSetting('filterBy', value)
      }
    },
    [isSeries, updateSetting]
  )

  const filterItems = useMemo(() => {
    const items: DropdownItem[] = [{ text: t('LabelAll'), value: 'all' }]

    // For series page, show reduced set of filters
    if (isSeries) {
      // Genre submenu
      if (filterData?.genres?.length) {
        items.push({
          text: t('LabelGenre'),
          value: 'genres',
          subitems: filterData.genres.map((genre) => ({
            text: genre,
            value: `genres.${filterEncode(genre)}`
          }))
        })
      }

      // Tags submenu
      if (filterData?.tags?.length) {
        items.push({
          text: t('LabelTag'),
          value: 'tags',
          subitems: filterData.tags.map((tag) => ({
            text: tag,
            value: `tags.${filterEncode(tag)}`
          }))
        })
      }

      // Authors submenu
      if (filterData?.authors?.length) {
        items.push({
          text: t('LabelAuthor'),
          value: 'authors',
          subitems: filterData.authors.map((author) => ({
            text: author.name,
            value: `authors.${filterEncode(author.id)}`
          }))
        })
      }

      // Narrators submenu
      if (filterData?.narrators?.length) {
        items.push({
          text: t('LabelNarrator'),
          value: 'narrators',
          subitems: filterData.narrators.map((narrator) => ({
            text: narrator,
            value: `narrators.${filterEncode(narrator)}`
          }))
        })
      }

      // Publishers submenu
      if (filterData?.publishers?.length) {
        items.push({
          text: t('LabelPublisher'),
          value: 'publishers',
          subitems: filterData.publishers.map((publisher) => ({
            text: publisher,
            value: `publishers.${filterEncode(publisher)}`
          }))
        })
      }

      // Languages submenu
      if (filterData?.languages?.length) {
        items.push({
          text: t('LabelLanguage'),
          value: 'languages',
          subitems: filterData.languages.map((language) => ({
            text: language,
            value: `languages.${filterEncode(language)}`
          }))
        })
      }

      // Series Progress submenu
      items.push({
        text: t('LabelSeriesProgress'),
        value: 'progress',
        subitems: [
          { text: t('LabelFinished'), value: `progress.${filterEncode('finished')}` },
          { text: t('LabelInProgress'), value: `progress.${filterEncode('in-progress')}` },
          { text: t('LabelNotStarted'), value: `progress.${filterEncode('not-started')}` },
          { text: t('LabelNotFinished'), value: `progress.${filterEncode('not-finished')}` }
        ]
      })

      return items
    }

    // Non-series filters (existing logic)
    // Genre submenu
    if (filterData?.genres?.length) {
      items.push({
        text: t('LabelGenre'),
        value: 'genres',
        subitems: filterData.genres.map((genre) => ({
          text: genre,
          value: `genres.${filterEncode(genre)}`
        }))
      })
    }

    // Tags submenu
    if (filterData?.tags?.length) {
      items.push({
        text: t('LabelTag'),
        value: 'tags',
        subitems: filterData.tags.map((tag) => ({
          text: tag,
          value: `tags.${filterEncode(tag)}`
        }))
      })
    }

    if (isBook) {
      // Series submenu - always show because it includes "No Series" option
      const seriesSubitems = [
        { text: t('MessageNoSeries'), value: `series.${filterEncode('no-series')}` },
        ...(filterData?.series?.map((s) => ({
          text: s.name,
          value: `series.${filterEncode(s.id)}`
        })) || [])
      ]
      items.push({ text: t('LabelSeries'), value: 'series', subitems: seriesSubitems })

      // Authors submenu
      if (filterData?.authors?.length) {
        items.push({
          text: t('LabelAuthor'),
          value: 'authors',
          subitems: filterData.authors.map((author) => ({
            text: author.name,
            value: `authors.${filterEncode(author.id)}`
          }))
        })
      }

      // Narrators submenu
      if (filterData?.narrators?.length) {
        items.push({
          text: t('LabelNarrator'),
          value: 'narrators',
          subitems: filterData.narrators.map((narrator) => ({
            text: narrator,
            value: `narrators.${filterEncode(narrator)}`
          }))
        })
      }

      // Publishers submenu
      if (filterData?.publishers?.length) {
        items.push({
          text: t('LabelPublisher'),
          value: 'publishers',
          subitems: filterData.publishers.map((publisher) => ({
            text: publisher,
            value: `publishers.${filterEncode(publisher)}`
          }))
        })
      }

      // Published Decade submenu
      if (filterData?.publishedDecades?.length) {
        items.push({
          text: t('LabelPublishedDecade'),
          value: 'publishedDecades',
          subitems: filterData.publishedDecades.map((decade) => ({
            text: `${decade}s`,
            value: `publishedDecades.${filterEncode(decade)}`
          }))
        })
      }
    }

    // Languages submenu (for both book and podcast)
    if (filterData?.languages?.length) {
      items.push({
        text: t('LabelLanguage'),
        value: 'languages',
        subitems: filterData.languages.map((language) => ({
          text: language,
          value: `languages.${filterEncode(language)}`
        }))
      })
    }

    // Progress submenu - only for books
    if (isBook) {
      items.push({
        text: t('LabelProgress'),
        value: 'progress',
        subitems: [
          { text: t('LabelFinished'), value: `progress.${filterEncode('finished')}` },
          { text: t('LabelInProgress'), value: `progress.${filterEncode('in-progress')}` },
          { text: t('LabelNotStarted'), value: `progress.${filterEncode('not-started')}` },
          { text: t('LabelNotFinished'), value: `progress.${filterEncode('not-finished')}` }
        ]
      })
    }

    if (isBook) {
      // Missing submenu
      items.push({
        text: t('LabelMissing'),
        value: 'missing',
        subitems: [
          { text: 'ASIN', value: `missing.${filterEncode('asin')}` },
          { text: 'ISBN', value: `missing.${filterEncode('isbn')}` },
          { text: t('LabelAuthor'), value: `missing.${filterEncode('authors')}` },
          { text: t('LabelChapters'), value: `missing.${filterEncode('chapters')}` },
          { text: t('LabelCover'), value: `missing.${filterEncode('cover')}` },
          { text: t('LabelDescription'), value: `missing.${filterEncode('description')}` },
          { text: t('LabelGenre'), value: `missing.${filterEncode('genres')}` },
          { text: t('LabelLanguage'), value: `missing.${filterEncode('language')}` },
          { text: t('LabelNarrator'), value: `missing.${filterEncode('narrators')}` },
          { text: t('LabelPublishYear'), value: `missing.${filterEncode('publishedYear')}` },
          { text: t('LabelPublisher'), value: `missing.${filterEncode('publisher')}` },
          { text: t('LabelSeries'), value: `missing.${filterEncode('series')}` },
          { text: t('LabelSubtitle'), value: `missing.${filterEncode('subtitle')}` },
          { text: t('LabelTags'), value: `missing.${filterEncode('tags')}` }
        ]
      })

      // Tracks submenu
      items.push({
        text: t('LabelTracks'),
        value: 'tracks',
        subitems: [
          { text: t('LabelTracksNone'), value: `tracks.${filterEncode('none')}` },
          { text: t('LabelTracksSingleTrack'), value: `tracks.${filterEncode('single')}` },
          { text: t('LabelTracksMultiTrack'), value: `tracks.${filterEncode('multi')}` }
        ]
      })

      // Ebooks submenu
      items.push({
        text: t('LabelEbooks'),
        value: 'ebooks',
        subitems: [
          { text: t('LabelHasEbook'), value: `ebooks.${filterEncode('ebook')}` },
          { text: t('LabelMissingEbook'), value: `ebooks.${filterEncode('no-ebook')}` },
          { text: t('LabelHasSupplementaryEbook'), value: `ebooks.${filterEncode('supplementary')}` },
          { text: t('LabelMissingSupplementaryEbook'), value: `ebooks.${filterEncode('no-supplementary')}` }
        ]
      })

      // Abridged (simple filter)
      items.push({ text: t('LabelAbridged'), value: 'abridged' })
    }

    // Simple filters
    items.push({ text: t('ButtonIssues'), value: 'issues' }, { text: t('LabelRSSFeedOpen'), value: 'feed-open' })

    // Explicit filter - only show if user has accessExplicitContent permission
    if (user?.permissions?.accessExplicitContent) {
      items.push({ text: t('LabelExplicit'), value: 'explicit' })
    }

    // Share Open filter - only show for admin/root users on book libraries (podcasts don't have shares)
    if (isBook && user && ['admin', 'root'].includes(user.type)) {
      items.push({ text: t('LabelShareOpen'), value: 'share-open' })
    }

    return items
  }, [t, filterData, isBook, isSeries, user])

  // Clear button logic
  const showClear = currentFilter !== 'all'

  if (entityType === 'authors') return null

  return (
    <div className="w-36 sm:w-44 md:w-48 h-9 relative">
      <Dropdown
        value={currentFilter}
        items={filterItems}
        onChange={handleFilterChange}
        size="auto"
        className="h-full text-xs"
        displayText={getSelectedText()}
        menuMaxHeight="80vh"
      />
      {showClear && (
        <button
          className="absolute inset-y-0 right-8 flex items-center text-gray-400 hover:text-white z-10"
          onClick={(e) => {
            e.stopPropagation()
            updateSetting(isSeries ? 'seriesFilterBy' : 'filterBy', 'all')
          }}
          title={t('ButtonClearFilter')}
        >
          <span className="material-symbols text-base">close</span>
        </button>
      )}
    </div>
  )
}
