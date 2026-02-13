'use client'

import LibraryFilterSelect from '@/app/(main)/library/[library]/LibraryFilterSelect'
import LibrarySortSelect from '@/app/(main)/library/[library]/LibrarySortSelect'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useBookshelfData } from '@/hooks/useBookshelfData'
import { useBookshelfQuery } from '@/hooks/useBookshelfQuery'
import { useBookshelfVirtualizer } from '@/hooks/useBookshelfVirtualizer'
import { usePersistentScroll } from '@/hooks/usePersistentScroll'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookshelfEntity, EntityType, MediaProgress, UserLoginResponse } from '@/types/api'
import { useEffect, useMemo, useRef, useState } from 'react'
import EntityCard from './EntityCard'
import EntityCardSkeleton from './EntityCardSkeleton'

interface BookshelfClientProps {
  entityType: EntityType
  // Different APIs return different structures:
  // - items/series/collections/playlists: { results: T[], total?: number }
  // - authors: { authors: Author[], total?: number }
  currentUser: UserLoginResponse
}

export default function BookshelfClient({ entityType, currentUser }: BookshelfClientProps) {
  const t = useTypeSafeTranslations()
  const { library, setItemCount, orderBy, collapseSeries, showSubtitles, seriesSortBy, updateSetting } = useLibrary()

  const { query } = useBookshelfQuery(entityType)

  const isPodcastLibrary = library.mediaType === 'podcast'
  const isBookLibrary = library.mediaType === 'book'

  // Scroll storage key
  const scrollKey = useMemo(() => `bookshelf-scroll-${library.id}-${entityType}-${query}`, [library.id, entityType, query])

  // Ref for the container div
  const containerRef = useRef<HTMLDivElement>(null)

  // Container dimensions state
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // totalEntities state
  const [totalEntities, setTotalEntities] = useState(0)

  // Card Dimensions & Layout Logic
  const { sizeMultiplier } = useCardSize()

  // Aspect Ratio
  const coverAspectRatio = library.settings?.coverAspectRatio ?? 1.6

  // Measured Card Size State
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 })
  const dummyCardRef = useRef<HTMLDivElement>(null)

  // Measure Dummy Card
  useEffect(() => {
    if (!dummyCardRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.borderBoxSize?.length > 0) {
          setCardSize({
            width: entry.borderBoxSize[0].inlineSize,
            height: entry.borderBoxSize[0].blockSize
          })
        } else {
          setCardSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          })
        }
      }
    })
    observer.observe(dummyCardRef.current)
    return () => observer.disconnect()
  }, [entityType, coverAspectRatio, showSubtitles, sizeMultiplier, orderBy])

  // Reset cardSize when sizeMultiplier or entityType changes so we wait for re-measurement
  useEffect(() => {
    setCardSize({ width: 0, height: 0 })
  }, [sizeMultiplier, entityType])

  // Computed Layout derived from measurements
  const shelfPadding = (dimensions.width < 640 ? 32 : 64) * sizeMultiplier
  const cardMargin = 24 * sizeMultiplier
  const totalEntityCardWidth = cardSize.width + cardMargin
  const shelfRowHeight = cardSize.height + 16 * sizeMultiplier

  // Resize Observer for Container
  useEffect(() => {
    if (!containerRef.current) return
    const measure = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: window.innerHeight - containerRef.current.getBoundingClientRect().top
        })
      }
    }
    measure()
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Virtualizer
  const hasMeasuredCard = cardSize.width > 0
  const { columns, shelfHeight, totalShelves, shelvesPerPage, visibleShelfStart, visibleShelfEnd, handleScroll } = useBookshelfVirtualizer({
    totalEntities,
    itemWidth: hasMeasuredCard ? totalEntityCardWidth : 0,
    itemHeight: hasMeasuredCard ? shelfRowHeight : 0,
    containerWidth: dimensions.width,
    containerHeight: dimensions.height,
    padding: shelfPadding / 2
  })

  // Use custom hook for persistent scroll logic
  const { handleScroll: handlePersistentScroll } = usePersistentScroll({
    scrollKey,
    containerRef,
    isEnabled: hasMeasuredCard && totalEntities > 0
  })

  // Author actions hook

  const bookshelfMarginLeft = Math.max(0, (dimensions.width - columns * totalEntityCardWidth) / 2)
  const itemsPerPage = columns * shelvesPerPage

  // Data hook
  const {
    items,
    loadPage,
    totalEntities: fetchedTotal,
    isLoading,
    isInitialized,
    error
  } = useBookshelfData({
    libraryId: library.id,
    entityType,
    query,
    itemsPerPage
  })

  // Sync total count from data hook
  useEffect(() => {
    if (isInitialized) {
      setTotalEntities(fetchedTotal)
    }
  }, [fetchedTotal, isInitialized])

  // Sync total count to context/toolbar
  useEffect(() => {
    setItemCount(totalEntities)
  }, [totalEntities, setItemCount])

  // Data Fetching Trigger
  useEffect(() => {
    if (!hasMeasuredCard || columns === 0 || itemsPerPage === 0) return

    const itemsPerShelf = columns
    const startItem = visibleShelfStart * itemsPerShelf
    const endItem = Math.min(totalEntities, visibleShelfEnd * itemsPerShelf)

    const startPage = Math.floor(startItem / itemsPerPage)
    const endPage = Math.floor(endItem / itemsPerPage)

    for (let p = startPage; p <= endPage; p++) {
      loadPage(p)
    }
  }, [hasMeasuredCard, visibleShelfStart, visibleShelfEnd, columns, totalEntities, itemsPerPage, loadPage])

  const userMediaProgress = currentUser.user.mediaProgress

  const bookProgressMap = useMemo(() => {
    const map = new Map<string, MediaProgress>()
    userMediaProgress.forEach((p) => {
      map.set(p.libraryItemId, p)
    })
    return map
  }, [userMediaProgress])

  // Inject Toolbar Controls and Menu Items
  const { setToolbarExtras, setContextMenuItems, setContextMenuActionHandler } = useLibrary()

  useEffect(() => {
    // Set up toolbar extras based on entity type
    switch (entityType) {
      case 'items':
        setToolbarExtras(
          <>
            <LibraryFilterSelect user={currentUser.user} entityType="items" />
            <LibrarySortSelect entityType="items" libraryMediaType={library.mediaType} />
          </>
        )
        break
      case 'series':
        setToolbarExtras(
          <>
            <LibraryFilterSelect user={currentUser.user} entityType="series" />
            <LibrarySortSelect entityType="series" />
          </>
        )
        break
      case 'authors':
        setToolbarExtras(
          <>
            <LibraryFilterSelect user={currentUser.user} entityType="authors" />
            <LibrarySortSelect entityType="authors" libraryMediaType={library.mediaType} />
          </>
        )
        break
      default:
        // collections and playlists have no sort/filter
        setToolbarExtras(null)
    }

    // Build context menu items based on entity type
    const menuItems: { text: string; action: string }[] = []

    if (entityType === 'items') {
      menuItems.push({
        text: showSubtitles ? t('LabelHideSubtitles') : t('LabelShowSubtitles'),
        action: showSubtitles ? 'hide-subtitles' : 'show-subtitles'
      })
      if (isBookLibrary) {
        menuItems.push({
          text: collapseSeries ? t('LabelExpandSeries') : t('LabelCollapseSeries'),
          action: collapseSeries ? 'expand-series' : 'collapse-series'
        })
      }
    } else if (entityType === 'authors' && currentUser.user.permissions?.update) {
      menuItems.push({
        text: t('ButtonMatchAllAuthors'),
        action: 'match-all-authors'
      })
    }

    setContextMenuItems(menuItems)

    // Set up action handler
    setContextMenuActionHandler((action: string) => {
      if (action === 'show-subtitles') {
        updateSetting('showSubtitles', true)
      } else if (action === 'hide-subtitles') {
        updateSetting('showSubtitles', false)
      } else if (action === 'expand-series') {
        updateSetting('collapseSeries', false)
      } else if (action === 'collapse-series') {
        updateSetting('collapseSeries', true)
      } else if (action === 'match-all-authors') {
        // TODO: Implement match all authors
        console.log('Match all authors - to be implemented')
      }
    })

    return () => {
      setToolbarExtras(null)
      setContextMenuItems([])
    }
  }, [
    entityType,
    setToolbarExtras,
    setContextMenuItems,
    setContextMenuActionHandler,
    updateSetting,
    library.mediaType,
    isBookLibrary,
    showSubtitles,
    collapseSeries,
    currentUser.user,
    t
  ])

  // Get empty state message based on entity type
  const getEmptyMessage = () => {
    switch (entityType) {
      case 'series':
        return t('MessageNoSeriesFound')
      case 'collections':
        return t('MessageNoCollectionsFound')
      case 'playlists':
        return t('MessageNoPlaylistsFound')
      case 'authors':
        return t('MessageNoAuthorsFound')
      default:
        if (isPodcastLibrary) {
          return t('MessageNoPodcastsFound')
        } else {
          return t('MessageNoBooksFound')
        }
    }
  }

  // VALIDATION CHECK
  const validEntities = isPodcastLibrary ? ['items', 'playlists'] : ['items', 'series', 'collections', 'playlists', 'authors']

  if (!validEntities.includes(entityType as string)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground-muted">
        <h2 className="text-2xl font-bold mb-2">{t('LabelPageNotFound')}</h2>
        <p>{t('MessagePageNotFoundForLibraryType')}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto relative py-8"
      style={{ fontSize: sizeMultiplier + 'rem' }}
      onScroll={(e) => {
        const scrollTop = e.currentTarget.scrollTop
        handleScroll(scrollTop)
        handlePersistentScroll(scrollTop)
      }}
    >
      {/* Measurement Dummy - Hidden but rendered for sizing */}
      <div ref={dummyCardRef} style={{ position: 'absolute', visibility: 'hidden', top: 0, left: 0, zIndex: -1 }} aria-hidden="true">
        <EntityCardSkeleton
          entityType={entityType}
          coverAspectRatio={coverAspectRatio}
          seriesSortBy={seriesSortBy}
          showSubtitles={showSubtitles}
          orderBy={orderBy}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="flex h-full flex-col items-center justify-center p-10 text-center">
          <p className="text-red-500 mb-2">{t('MessageFailedToLoadData')}</p>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <button onClick={() => loadPage(0)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            {t('ButtonRetry')}
          </button>
        </div>
      )}

      {/* Virtualized content */}
      {hasMeasuredCard && !error && (
        <div className="relative w-full" style={{ height: `${totalShelves * shelfHeight}px` }}>
          {/* Render Visible Shelves */}
          {Array.from({ length: visibleShelfEnd - visibleShelfStart }).map((_, i) => {
            const shelfIndex = visibleShelfStart + i
            const startIndex = shelfIndex * columns
            const shelfItems: (BookshelfEntity | null)[] = []
            for (let k = 0; k < columns; k++) {
              const itemIndex = startIndex + k
              if (itemIndex < totalEntities) {
                shelfItems.push(items[itemIndex] ?? null)
              }
            }

            return (
              <div
                key={shelfIndex}
                className="absolute left-0 w-full flex"
                style={{
                  top: `${shelfIndex * shelfHeight}px`,
                  height: `${shelfHeight}px`,
                  paddingLeft: `${bookshelfMarginLeft}px`,
                  gap: `${cardMargin}px`
                }}
              >
                {shelfItems.map((item, k) => {
                  const currentCardWidth = cardSize.width || 120

                  if (!item) {
                    return (
                      <div key={`skeleton-wrapper-${startIndex + k}`} style={{ width: `${currentCardWidth}px`, flexShrink: 0 }}>
                        <EntityCardSkeleton
                          entityType={entityType}
                          coverAspectRatio={coverAspectRatio}
                          seriesSortBy={seriesSortBy}
                          showSubtitles={showSubtitles}
                          orderBy={orderBy}
                        />
                      </div>
                    )
                  }

                  return (
                    <EntityCard
                      key={`card-wrapper-${item.id}`}
                      entity={item}
                      entityType={entityType}
                      width={currentCardWidth}
                      libraryId={library.id}
                      isPodcastLibrary={isPodcastLibrary}
                      coverAspectRatio={coverAspectRatio}
                      showSubtitles={showSubtitles}
                      currentUser={currentUser}
                      orderBy={orderBy}
                      seriesSortBy={seriesSortBy}
                      bookProgressMap={bookProgressMap}
                    />
                  )
                })}
              </div>
            )
          })}

          {/* Empty State */}
          {!isLoading && totalEntities === 0 && (
            <div className="flex h-full items-center justify-center p-10">
              <p>{getEmptyMessage()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
