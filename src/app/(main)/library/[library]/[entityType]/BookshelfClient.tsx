'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useUser } from '@/contexts/UserContext'
import { useBookshelfData } from '@/hooks/useBookshelfData'
import { useBookshelfQuery } from '@/hooks/useBookshelfQuery'
import { useBookshelfVirtualizer } from '@/hooks/useBookshelfVirtualizer'
import { usePersistentScroll } from '@/hooks/usePersistentScroll'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookshelfEntity, BookshelfView, EntityType, MediaProgress } from '@/types/api'
import { useEffect, useMemo, useRef, useState } from 'react'
import LibraryEmptyState from '../LibraryEmptyState'
import { ENTITY_CONFIGS } from './entity-config'

interface BookshelfClientProps {
  entityType: EntityType
  // Different APIs return different structures:
  // - items/series/collections/playlists: { results: T[], total?: number }
  // - authors: { authors: Author[], total?: number }
}

export default function BookshelfClient({ entityType }: BookshelfClientProps) {
  const t = useTypeSafeTranslations()
  const { library, setItemCount, orderBy, collapseSeries, showSubtitles, seriesSortBy, updateSetting, filterBy, boundModal, bookshelfView } = useLibrary()
  const { user } = useUser()

  const { query } = useBookshelfQuery(entityType)

  const isPodcastLibrary = library.mediaType === 'podcast'

  // VALIDATION CHECK
  const validEntities = isPodcastLibrary ? ['items', 'playlists'] : ['items', 'series', 'collections', 'playlists', 'authors']

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
  const coverAspectRatio = library.settings?.coverAspectRatio ?? 1

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

  const isAlternativeBookshelfView = bookshelfView === BookshelfView.DETAIL
  // A standard bookshelf divider is 1.5rem (24px).
  // In alternative view there is no divider.
  const dividerHeight = isAlternativeBookshelfView ? 0 : 24
  const shelfRowHeight = cardSize.height + (16 + dividerHeight) * sizeMultiplier

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
    if (isInitialized) {
      setItemCount(fetchedTotal)
    } else {
      setItemCount(null)
    }
  }, [fetchedTotal, isInitialized, setItemCount])

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

  const userMediaProgress = user.mediaProgress

  const bookProgressMap = useMemo(() => {
    const map = new Map<string, MediaProgress>()
    userMediaProgress.forEach((p) => {
      map.set(p.libraryItemId, p)
    })
    return map
  }, [userMediaProgress])

  // Inject Toolbar Controls and Menu Items
  const { setToolbarExtras, setContextMenuItems, setContextMenuActionHandler } = useLibrary()

  // Get Entity Config
  const config = validEntities.includes(entityType as string) ? ENTITY_CONFIGS[entityType] : null

  useEffect(() => {
    if (!config) return
    // Set up toolbar extras based on entity config
    setToolbarExtras(config.getToolbarExtras(user, library))

    // Build context menu items based on entity config
    const rawMenuItems = config.getContextMenuItems(user, library, { showSubtitles, collapseSeries })
    const menuItems = rawMenuItems.map((item) => ({
      text: t(item.textKey),
      action: item.action
    }))

    setContextMenuItems(menuItems)

    // Set up action handler (delegated to entity config)
    setContextMenuActionHandler((action: string) => {
      config.handleContextMenuAction(action, { updateSetting })
    })

    return () => {
      setToolbarExtras(null)
      setContextMenuItems([])
    }
  }, [entityType, config, setToolbarExtras, setContextMenuItems, setContextMenuActionHandler, updateSetting, library, showSubtitles, collapseSeries, user, t])

  // Get empty state message based on entity config
  const getEmptyMessage = () => {
    if (!config) return ''
    const messageKey = config.getEmptyMessageKey(filterBy, isPodcastLibrary)
    return messageKey ? t(messageKey) : ''
  }

  if (!validEntities.includes(entityType as string) || !config) {
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
      className={isAlternativeBookshelfView ? 'h-full overflow-y-auto relative py-8' : 'h-full overflow-y-auto relative'}
      style={{ fontSize: sizeMultiplier + 'rem' }}
      onScroll={(e) => {
        const scrollTop = e.currentTarget.scrollTop
        handleScroll(scrollTop)
        handlePersistentScroll(scrollTop)
      }}
    >
      {/* Measurement Dummy - Hidden but rendered for sizing */}
      <div ref={dummyCardRef} style={{ position: 'absolute', visibility: 'hidden', top: 0, left: 0, zIndex: -1 }} aria-hidden="true">
        <config.SkeletonComponent
          bookshelfView={bookshelfView}
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
        <div className="relative w-full" style={{ height: totalShelves === 0 ? 'unset' : `${totalShelves * shelfHeight}px` }}>
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
                className={`absolute left-0 w-full flex ${!isAlternativeBookshelfView ? 'bookshelfRow' : ''}`}
                style={{
                  top: `${shelfIndex * shelfHeight}px`,
                  height: `${shelfHeight}px`,
                  paddingLeft: `${bookshelfMarginLeft}px`,
                  // To push the cards to the bottom of the flex container (and touch the divider), we align items to center and add some pt-6e equivalent to the cards or use items-end with padding-bottom for the divider.
                  // BookShelfRow uses pt-6e (24px) to push the content down. Then the divider is positioned exactly under it.
                  paddingTop: !isAlternativeBookshelfView ? `${16 * sizeMultiplier}px` : undefined,
                  gap: `${cardMargin}px`
                }}
              >
                {shelfItems.map((item, k) => {
                  const currentCardWidth = cardSize.width || 120

                  if (!item) {
                    return (
                      <div key={`skeleton-wrapper-${startIndex + k}`} style={{ width: `${currentCardWidth}px`, flexShrink: 0 }}>
                        <config.SkeletonComponent
                          bookshelfView={bookshelfView}
                          coverAspectRatio={coverAspectRatio}
                          seriesSortBy={seriesSortBy}
                          showSubtitles={showSubtitles}
                          orderBy={orderBy}
                        />
                      </div>
                    )
                  }

                  return (
                    <config.CardComponent
                      key={`card-wrapper-${item.id}`}
                      entity={item}
                      bookshelfView={bookshelfView}
                      width={currentCardWidth}
                      libraryId={library.id}
                      isPodcastLibrary={isPodcastLibrary}
                      coverAspectRatio={coverAspectRatio}
                      showSubtitles={showSubtitles}
                      orderBy={orderBy}
                      seriesSortBy={seriesSortBy}
                      bookProgressMap={bookProgressMap}
                    />
                  )
                })}
                {!isAlternativeBookshelfView && <div className="bookshelfDivider w-full absolute bottom-0 left-0 right-0 z-20 h-6e" />}
              </div>
            )
          })}

          {/* Empty State */}
          {isInitialized && !isLoading && fetchedTotal === 0 && (
            <>
              {entityType === 'items' && filterBy === 'all' ? (
                <LibraryEmptyState library={library} showScanButton={['admin', 'root'].includes(user.type)} />
              ) : (
                <div className="flex h-full items-center justify-center p-10">
                  <p className="text-xl">{getEmptyMessage()}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {boundModal}
    </div>
  )
}
