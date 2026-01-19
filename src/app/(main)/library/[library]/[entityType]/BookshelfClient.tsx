'use client'

import AuthorEditModal from '@/components/modals/AuthorEditModal'
import { EntityCard } from '@/components/widgets/media-card/EntityCard'
import { EntitySkeleton } from '@/components/widgets/media-card/EntitySkeleton'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useLibraryDataContext } from '@/contexts/LibraryDataContext'
import { useAuthorActions } from '@/hooks/useAuthorActions'
import { useBookshelfControls } from '@/hooks/useBookshelfControls'
import { useBookshelfQuery } from '@/hooks/useBookshelfQuery'
import { useBookshelfVirtualizer } from '@/hooks/useBookshelfVirtualizer'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Author, BookshelfEntity, EntityType, MediaProgress, UserLoginResponse } from '@/types/api'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

interface BookshelfClientProps {
  entityType: EntityType
  currentUser: UserLoginResponse
}

export default function BookshelfClient({ entityType, currentUser }: BookshelfClientProps) {
  const t = useTypeSafeTranslations()
  const { library, setItemCount, orderBy, showSubtitles, seriesSortBy } = useLibrary()

  const { query } = useBookshelfQuery(entityType)
  const searchParams = useSearchParams()
  const focusIndex = parseInt(searchParams.get('focusIndex') || '', 10)

  const [isAuthorEditModalOpen, setIsAuthorEditModalOpen] = useState(false)
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)

  // Ref for the container div
  const containerRef = useRef<HTMLDivElement>(null)

  // Container dimensions state
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Reset scroll position when query changes (sort/filter changed)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [query])

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

  const {
    items: contextItems,
    total: totalEntities,
    isLoading,
    load,
    updateItem: updateItemInContext,
    removeItem: removeItemFromContext
  } = useLibraryDataContext<BookshelfEntity>(entityType, null, query, library.id, false)

  const isPodcastLibrary = library.mediaType === 'podcast'

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
      entries.forEach(() => {
        measure() // Re-measure on resize
      })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, []) // Empty deps for single mount observer setup

  // Virtualizer
  const hasMeasuredCard = cardSize.width > 0
  const { columns, shelfHeight, totalShelves, shelvesPerPage, visibleShelfStart, visibleShelfEnd, handleScroll } = useBookshelfVirtualizer({
    totalEntities, // This now uses the aliased 'totalEntities'
    itemWidth: hasMeasuredCard ? totalEntityCardWidth : 0,
    itemHeight: hasMeasuredCard ? shelfRowHeight : 0,
    containerWidth: dimensions.width,
    containerHeight: dimensions.height,
    padding: shelfPadding / 2
  })

  const visibleShelfCount = visibleShelfEnd - visibleShelfStart

  // Scroll to focused item
  useEffect(() => {
    if (isNaN(focusIndex) || !hasMeasuredCard || columns === 0 || shelfHeight === 0 || !containerRef.current) {
      return
    }

    // Calculate row
    const row = Math.floor(focusIndex / columns)
    const scrollTop = row * shelfHeight

    // Scroll
    containerRef.current.scrollTop = scrollTop

    // Try to focus the element after a brief delay to allow virtualization to render
    setTimeout(() => {
      const el = document.getElementById(`entity-card-${focusIndex}`)
      if (el) {
        el.focus({ preventScroll: true })
      }
    }, 100)
  }, [focusIndex, hasMeasuredCard, columns, shelfHeight])

  // Center the bookshelf
  const bookshelfMarginLeft = Math.max(0, (dimensions.width - columns * totalEntityCardWidth) / 2)
  const itemsPerPage = columns * shelvesPerPage

  // Author actions hook - wrap the context functions to match the expected signature
  const {
    quickMatchingAuthorIds,
    handleQuickMatch,
    handleSave: handleAuthorSave,
    handleDelete: handleAuthorDelete,
    handleSubmitImage: handleAuthorSubmitImage,
    handleRemoveImage: handleAuthorRemoveImage
  } = useAuthorActions({
    updateItem: (id: string, item: BookshelfEntity) => updateItemInContext(item),
    removeItem: (id: string) => removeItemFromContext(id),
    libraryProvider: library.provider || 'audible',
    selectedAuthor,
    setSelectedAuthor,
    setIsModalOpen: setIsAuthorEditModalOpen
  })

  // Sync total count to context/toolbar
  useEffect(() => {
    setItemCount(totalEntities)
  }, [totalEntities, setItemCount])

  // Data Fetching Trigger
  useEffect(() => {
    if (!hasMeasuredCard || columns === 0 || itemsPerPage === 0) return

    const itemsPerShelf = columns
    const startItem = visibleShelfStart * itemsPerShelf
    const endItem = Math.min(totalEntities, visibleShelfEnd * itemsPerShelf + itemsPerPage) // Add buffer

    const CHUNK_SIZE = 50
    const startPage = Math.floor(startItem / CHUNK_SIZE)
    const endPage = Math.floor(endItem / CHUNK_SIZE)

    for (let p = startPage; p <= endPage; p++) {
      load(p, CHUNK_SIZE)
    }
  }, [hasMeasuredCard, visibleShelfStart, visibleShelfEnd, columns, totalEntities, itemsPerPage, load])

  const userMediaProgress = currentUser.user.mediaProgress

  const bookProgressMap = useMemo(() => {
    const map = new Map<string, MediaProgress>()
    userMediaProgress.forEach((p) => {
      map.set(p.libraryItemId, p)
    })
    return map
  }, [userMediaProgress])

  // Inject Toolbar Controls and Menu Items
  useBookshelfControls(entityType, currentUser)

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
      onScroll={(e) => handleScroll(e.currentTarget.scrollTop)}
    >
      {/* Measurement Dummy - Hidden but rendered for sizing */}
      <div ref={dummyCardRef} style={{ position: 'absolute', visibility: 'hidden', top: 0, left: 0, zIndex: -1 }} aria-hidden="true">
        <EntitySkeleton
          entityType={entityType}
          coverAspectRatio={coverAspectRatio}
          seriesSortBy={seriesSortBy}
          orderBy={orderBy}
          showSubtitles={showSubtitles}
        />
      </div>

      {/* Virtualized content */}
      {hasMeasuredCard && (
        <div className="relative w-full" style={{ height: `${totalShelves * shelfHeight}px` }}>
          {/* Render Visible Shelves */}
          {Array.from({ length: visibleShelfCount }).map((_, i) => {
            const shelfIndex = visibleShelfStart + i
            const startIndex = shelfIndex * columns
            const shelfItems: (BookshelfEntity | null)[] = []
            for (let k = 0; k < columns; k++) {
              const itemIndex = startIndex + k
              if (itemIndex < totalEntities) {
                shelfItems.push(contextItems[itemIndex] ?? null)
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
                        <EntitySkeleton
                          entityType={entityType}
                          coverAspectRatio={coverAspectRatio}
                          seriesSortBy={seriesSortBy}
                          orderBy={orderBy}
                          showSubtitles={showSubtitles}
                        />
                      </div>
                    )
                  }

                  return (
                    <EntityCard
                      key={`card-wrapper-${item.id}`}
                      entity={item}
                      entityType={entityType}
                      libraryId={library.id}
                      isPodcastLibrary={isPodcastLibrary}
                      cardWidth={currentCardWidth}
                      id={`entity-card-${startIndex + k}`}
                      coverAspectRatio={coverAspectRatio}
                      currentUser={currentUser}
                      seriesSortBy={seriesSortBy}
                      orderBy={orderBy}
                      bookProgressMap={bookProgressMap}
                      showSubtitles={showSubtitles}
                      query={query}
                      index={startIndex + k}
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

      {/* Modals */}
      <AuthorEditModal
        isOpen={isAuthorEditModalOpen}
        author={selectedAuthor}
        user={currentUser.user}
        isProcessing={quickMatchingAuthorIds.has(selectedAuthor?.id ?? '')}
        onClose={() => {
          setIsAuthorEditModalOpen(false)
          setSelectedAuthor(null)
        }}
        onQuickMatch={(editedAuthor) => selectedAuthor && handleQuickMatch(selectedAuthor, editedAuthor)}
        onSave={handleAuthorSave}
        onDelete={handleAuthorDelete}
        onSubmitImage={handleAuthorSubmitImage}
        onRemoveImage={handleAuthorRemoveImage}
      />
    </div>
  )
}
