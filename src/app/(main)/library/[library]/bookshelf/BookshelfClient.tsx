'use client'

import LibraryFilterSelect from '@/app/(main)/library/[library]/LibraryFilterSelect'
import LibrarySortSelect from '@/app/(main)/library/[library]/LibrarySortSelect'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import CollapsedSeriesCard from '@/components/widgets/media-card/CollapsedSeriesCard'
import MediaCardSkeleton from '@/components/widgets/media-card/MediaCardSkeleton'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useBookshelfData } from '@/hooks/useBookshelfData'
import { useBookshelfVirtualizer } from '@/hooks/useBookshelfVirtualizer'
import { BookshelfView, GetLibraryItemsResponse, Library, UserLoginResponse } from '@/types/api'
import { useEffect, useMemo, useRef, useState } from 'react'

interface BookshelfClientProps {
  library: Library
  libraryItemsData: GetLibraryItemsResponse
  currentUser: UserLoginResponse
}

export default function BookshelfClient({ library, libraryItemsData, currentUser }: BookshelfClientProps) {
  const { setItemCount, orderBy, orderDesc, filterBy, collapseSeries, showSubtitles } = useLibrary()
  const isPodcastLibrary = library.mediaType === 'podcast'
  const actualShowSubtitles = isPodcastLibrary ? false : showSubtitles

  // Ref for the container div
  const containerRef = useRef<HTMLDivElement>(null)

  // Container dimensions state
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Build query string based on context settings
  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (orderBy) {
      params.set('sort', orderBy)
      params.set('desc', orderDesc ? '1' : '0')
    }
    if (filterBy && filterBy !== 'all') {
      params.set('filter', filterBy)
    }
    if (collapseSeries && !isPodcastLibrary) {
      params.set('collapseseries', '1')
    }
    return params.toString()
  }, [orderBy, orderDesc, filterBy, collapseSeries, isPodcastLibrary])

  // Reset scroll position when query changes (sort/filter changed)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [query])

  // totalEntities state for initial render before data hook is ready
  const [totalEntities, setTotalEntities] = useState(libraryItemsData.total ?? 0)

  // Card Dimensions & Layout Logic (Parity with LazyBookshelf.vue)
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
  }, [coverAspectRatio, actualShowSubtitles, sizeMultiplier, orderBy])

  // Reset cardSize when sizeMultiplier changes so we wait for re-measurement
  useEffect(() => {
    setCardSize({ width: 0, height: 0 })
  }, [sizeMultiplier])

  // Computed Layout derived from measurements
  // Shelf Padding: < 640px ? 32 : 64
  const shelfPadding = (dimensions.width < 640 ? 32 : 64) * sizeMultiplier

  // Margin between cards (Vue: 24 * sizeMultiplier)
  const cardMargin = 24 * sizeMultiplier

  // Total width per item logic
  // If cardSize is not yet measured, these will be 0, virtualizer handles 0 gracefully or we block render
  const totalEntityCardWidth = cardSize.width + cardMargin

  // Row Height logic
  // Vue: cardHeight + (16 + (isDetail ? 0 : 24)) * multiplier
  // We are using DETAIL (Modern) view currently as hardcoded prop
  // So shelfHeight = cardHeight + 16 * sizeMultiplier
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
          // Use contentRect.width for container width
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Virtualizer
  // We need to pass the *exact* width available for cards to the virtualizer
  // useBookshelfVirtualizer calculates columns based on `(containerWidth - padding*2) / itemWidth`.
  // We want: columns = floor((width - shelfPadding) / totalEntityCardWidth)
  // Only use measured dimensions if cardSize has been measured (width > 0), otherwise use fallback
  const hasMeasuredCard = cardSize.width > 0
  const { columns, shelfHeight, totalShelves, shelvesPerPage, visibleShelfStart, visibleShelfEnd, handleScroll } = useBookshelfVirtualizer({
    totalEntities,
    itemWidth: hasMeasuredCard ? totalEntityCardWidth : 0,
    itemHeight: hasMeasuredCard ? shelfRowHeight : 0,
    containerWidth: dimensions.width,
    containerHeight: dimensions.height,
    padding: shelfPadding / 2
  })

  // Calculate Centering Offset (bookshelfMarginLeft)
  // Vue: (bookshelfWidth - entitiesPerShelf * totalEntityCardWidth) / 2
  const bookshelfMarginLeft = Math.max(0, (dimensions.width - columns * totalEntityCardWidth) / 2)

  // Adaptive items per page: columns * shelvesPerPage (Vue: booksPerFetch = entitiesPerShelf * shelvesPerPage)
  const itemsPerPage = columns * shelvesPerPage

  // Sync total count from data hook
  const {
    items,
    loadPage,
    totalEntities: fetchedTotal,
    isLoading,
    isInitialized,
    error
  } = useBookshelfData({
    libraryId: library.id,
    query,
    initialTotal: libraryItemsData.total ?? 0,
    itemsPerPage
  })

  // Sync total count from data hook - update when data is initialized (including 0 results)
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
    // Wait until card is measured and layout is ready
    if (!hasMeasuredCard || columns === 0 || itemsPerPage === 0) return

    // Determine which pages cover the visible shelves
    const itemsPerShelf = columns
    const startItem = visibleShelfStart * itemsPerShelf
    const endItem = Math.min(totalEntities, visibleShelfEnd * itemsPerShelf)

    const startPage = Math.floor(startItem / itemsPerPage)
    const endPage = Math.floor(endItem / itemsPerPage)

    for (let p = startPage; p <= endPage; p++) {
      loadPage(p)
    }
  }, [hasMeasuredCard, visibleShelfStart, visibleShelfEnd, columns, totalEntities, itemsPerPage, loadPage])

  const EntityMediaCard = isPodcastLibrary ? PodcastMediaCard : BookMediaCard
  const userMediaProgress = currentUser.user.mediaProgress

  // Inject Toolbar Controls and Menu Items
  const { setToolbarExtras, setContextMenuItems, setContextMenuActionHandler, updateSetting } = useLibrary()
  const isBookLibrary = library.mediaType === 'book'

  useEffect(() => {
    setToolbarExtras(
      <>
        <LibraryFilterSelect user={currentUser.user} />
        <LibrarySortSelect libraryMediaType={library.mediaType} />
      </>
    )

    // Build context menu items
    const menuItems = []

    // Add collapse/expand series only for book libraries
    if (isBookLibrary) {
      menuItems.push({
        text: actualShowSubtitles ? 'Hide Subtitles' : 'Show Subtitles',
        action: actualShowSubtitles ? 'hide-subtitles' : 'show-subtitles'
      })
      menuItems.push({
        text: collapseSeries ? 'Expand Series' : 'Collapse Series',
        action: collapseSeries ? 'expand-series' : 'collapse-series'
      })
    } else {
      menuItems.push({
        text: 'Export OPML',
        action: 'export-opml'
      })
    }

    setContextMenuItems(menuItems)

    // Set up action handler
    setContextMenuActionHandler((action: string) => {
      if (action === 'export-opml') {
        // TODO: Implement export OPML
        console.log('Not implemented yet')
      } else if (action === 'show-subtitles') {
        updateSetting('showSubtitles', true)
      } else if (action === 'hide-subtitles') {
        updateSetting('showSubtitles', false)
      } else if (action === 'expand-series') {
        updateSetting('collapseSeries', false)
      } else if (action === 'collapse-series') {
        updateSetting('collapseSeries', true)
      }
    })

    return () => {
      setToolbarExtras(null)
      setContextMenuItems([])
    }
  }, [
    setToolbarExtras,
    setContextMenuItems,
    setContextMenuActionHandler,
    updateSetting,
    library.mediaType,
    isBookLibrary,
    actualShowSubtitles,
    collapseSeries,
    currentUser.user
  ])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto relative py-8"
      style={{ fontSize: sizeMultiplier + 'rem' }}
      onScroll={(e) => handleScroll(e.currentTarget.scrollTop)}
    >
      {/* Measurement Dummy - Hidden but rendered for sizing */}
      <div ref={dummyCardRef} style={{ position: 'absolute', visibility: 'hidden', top: 0, left: 0, zIndex: -1 }} aria-hidden="true">
        <MediaCardSkeleton bookshelfView={BookshelfView.DETAIL} bookCoverAspectRatio={coverAspectRatio} showSubtitles={actualShowSubtitles} orderBy={orderBy} />
      </div>

      {/* Error State - Show regardless of card measurement */}
      {error && (
        <div className="flex h-full flex-col items-center justify-center p-10 text-center">
          <p className="text-red-500 mb-2">Failed to load library items</p>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <button onClick={() => loadPage(0)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Only render virtualized content after card size is measured and no error */}
      {hasMeasuredCard && !error && (
        <div className="relative w-full" style={{ height: `${totalShelves * shelfHeight}px` }}>
          {/* Render Visible Shelves */}
          {Array.from({ length: visibleShelfEnd - visibleShelfStart }).map((_, i) => {
            const shelfIndex = visibleShelfStart + i
            const startIndex = shelfIndex * columns
            // Get items for this shelf
            // Slice items for this row
            // Note: items array might have holes (undefined/null)
            const shelfItems = []
            for (let k = 0; k < columns; k++) {
              const itemIndex = startIndex + k
              if (itemIndex < totalEntities) {
                shelfItems.push(items[itemIndex])
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
                        <MediaCardSkeleton
                          key={`skeleton-${startIndex + k}`}
                          bookshelfView={BookshelfView.DETAIL}
                          bookCoverAspectRatio={coverAspectRatio}
                          showSubtitles={actualShowSubtitles}
                          orderBy={orderBy}
                        />
                      </div>
                    )
                  }

                  // Render Actual Card - use CollapsedSeriesCard for collapsed series items
                  const isCollapsedSeries = !!item.collapsedSeries
                  const entityProgress = isPodcastLibrary ? null : userMediaProgress.find((progress) => progress.libraryItemId === item.id)

                  if (isCollapsedSeries) {
                    return (
                      <div key={`card-wrapper-${item.id}`} style={{ width: `${currentCardWidth}px`, flexShrink: 0 }}>
                        <CollapsedSeriesCard
                          key={item.id}
                          libraryItem={item}
                          bookshelfView={BookshelfView.DETAIL}
                          bookCoverAspectRatio={coverAspectRatio}
                          mediaProgress={entityProgress}
                          isSelectionMode={false}
                          selected={false}
                          onSelect={() => {}}
                          dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                          timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
                          showSubtitles={actualShowSubtitles}
                          orderBy={orderBy}
                        />
                      </div>
                    )
                  }

                  return (
                    <div key={`card-wrapper-${item.id}`} style={{ width: `${currentCardWidth}px`, flexShrink: 0 }}>
                      <EntityMediaCard
                        key={item.id}
                        libraryItem={item}
                        bookshelfView={BookshelfView.DETAIL}
                        bookCoverAspectRatio={coverAspectRatio}
                        mediaProgress={entityProgress}
                        isSelectionMode={false}
                        selected={false}
                        onSelect={() => {}}
                        dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                        timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
                        userPermissions={currentUser.user.permissions}
                        ereaderDevices={currentUser.ereaderDevices}
                        showSubtitles={actualShowSubtitles}
                        orderBy={orderBy}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Empty State */}
          {!isLoading && totalEntities === 0 && (
            <div className="flex h-full items-center justify-center p-10">
              <p>No items found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
