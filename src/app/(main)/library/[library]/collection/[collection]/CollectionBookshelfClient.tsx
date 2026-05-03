'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { useBookCoverAspectRatio, useLibrary } from '@/contexts/LibraryContext'
import { useUser } from '@/contexts/UserContext'
import { useBookshelfVirtualizer } from '@/hooks/useBookshelfVirtualizer'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatDuration } from '@/lib/formatDuration'
import { buildMediaItemProgressMap } from '@/lib/mediaProgress'
import type { BookshelfEntity, Collection, LibraryItem } from '@/types/api'
import { BookshelfView } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ENTITY_CONFIGS } from '../../[entityType]/entity-config'
import CollectionBookCardShell from './CollectionBookCardShell'
import CollectionBookshelfReorderGrid from './CollectionBookshelfReorderGrid'

const itemsConfig = ENTITY_CONFIGS.items

interface CollectionBookshelfClientProps {
  collection: Collection
}

export default function CollectionBookshelfClient({ collection }: CollectionBookshelfClientProps) {
  const t = useTypeSafeTranslations()
  const { user, userCanUpdate } = useUser()
  const { library, orderBy, showSubtitles, seriesSortBy, bookshelfView } = useLibrary()
  const { sizeMultiplier } = useCardSize()
  const coverAspect = useBookCoverAspectRatio()
  const coverHeight = 192 * sizeMultiplier
  /** Same width as `MediaCard` / `MediaCardSkeleton` cover column (not the scrollport). */
  const nominalCoverWidth = coverHeight / coverAspect
  const canReorder = userCanUpdate

  const serverBookIds = useMemo(() => (collection.books ?? []).map((b) => b.id).join(','), [collection.books])

  const [orderedBooks, setOrderedBooks] = useState<LibraryItem[]>(() => collection.books ?? [])

  useEffect(() => {
    setOrderedBooks(collection.books ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serverBookIds reflects collection.books order and membership
  }, [collection.id, serverBookIds])

  const totalEntities = orderedBooks.length

  const totalDurationSeconds = useMemo(() => {
    let sum = 0
    for (const book of orderedBooks) {
      const d = book.media && 'duration' in book.media ? book.media.duration : 0
      sum += typeof d === 'number' && Number.isFinite(d) ? d : 0
    }
    return sum
  }, [orderedBooks])

  const totalDurationLabel = totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds, t, { showDays: true }) : null

  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const dummyCardRef = useRef<HTMLDivElement>(null)
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 })

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
  }, [library.settings?.coverAspectRatio, showSubtitles, sizeMultiplier, orderBy])

  useEffect(() => {
    setCardSize({ width: 0, height: 0 })
  }, [sizeMultiplier])

  /**
   * Tighter horizontal gap on narrow scrollports so two columns can still fit (main bookshelf
   * uses full library width; this page adds outer padding, so we scale gap down by width tier).
   */
  const cardMargin = useMemo(() => {
    const w = dimensions.width
    if (w <= 0) return 24 * sizeMultiplier
    if (w < 380) return 8 * sizeMultiplier
    if (w < 480) return 16 * sizeMultiplier
    return 24 * sizeMultiplier
  }, [dimensions.width, sizeMultiplier])

  const isAlternativeBookshelfView = bookshelfView === BookshelfView.DETAIL
  const dividerHeight = isAlternativeBookshelfView ? 0 : 24

  /**
   * The hidden measurement node can incorrectly inherit the scrollport width; never treat a
   * measured width larger than the real cover column as the card width for column math.
   */
  const layoutCardWidth = useMemo(() => {
    if (cardSize.width <= 0) return nominalCoverWidth
    return Math.min(cardSize.width, nominalCoverWidth + 1)
  }, [cardSize.width, nominalCoverWidth])

  const estimatedCardBodyHeight = coverHeight + (isAlternativeBookshelfView ? 96 * sizeMultiplier : 0)
  const maxCardBodyHeight = coverHeight + (isAlternativeBookshelfView ? 220 : 48) * sizeMultiplier
  const cardBodyHeight = useMemo(() => {
    if (cardSize.height <= 0) return estimatedCardBodyHeight
    return Math.min(cardSize.height, maxCardBodyHeight)
  }, [cardSize.height, estimatedCardBodyHeight, maxCardBodyHeight])

  const shelfRowHeight = cardBodyHeight + (16 + dividerHeight) * sizeMultiplier

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
      const el = containerRef.current
      if (!el || entries.length === 0) return
      const entry = entries[0]
      // clientWidth matches the scrollport used for layout; contentRect.width can differ when a
      // vertical scrollbar consumes width and was inflating column count / grid width by a few px.
      setDimensions({
        width: el.clientWidth,
        height: entry.contentRect.height
      })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const canLayoutShelf = dimensions.width > 0 && nominalCoverWidth > 0 && shelfRowHeight > 0
  const { columns, shelfHeight, totalShelves, visibleShelfStart, visibleShelfEnd, handleScroll } = useBookshelfVirtualizer({
    totalEntities,
    cardWidth: canLayoutShelf ? layoutCardWidth : 0,
    columnGap: cardMargin,
    itemHeight: canLayoutShelf ? shelfRowHeight : 0,
    containerWidth: dimensions.width,
    containerHeight: dimensions.height
  })

  /** Pixel width of a full shelf row (N cards + N−1 gaps). */
  const bookshelfRowWidth = useMemo(() => {
    if (!canLayoutShelf || columns <= 0) return 0
    return columns * layoutCardWidth + Math.max(0, columns - 1) * cardMargin
  }, [canLayoutShelf, columns, layoutCardWidth, cardMargin])

  /** Centers the row in the scroll container’s layout width (clientWidth — content area). */
  const bookshelfMarginLeft = useMemo(() => {
    if (!canLayoutShelf || columns <= 0 || dimensions.width <= 0 || bookshelfRowWidth <= 0) return 0
    return Math.max(0, (dimensions.width - bookshelfRowWidth) / 2)
  }, [canLayoutShelf, columns, dimensions.width, bookshelfRowWidth])

  const mediaItemProgressMap = useMemo(() => buildMediaItemProgressMap(user.mediaProgress), [user.mediaProgress])

  const shelfEntitiesDense = useMemo(() => orderedBooks as unknown as (BookshelfEntity | null)[], [orderedBooks])

  const renderCard = useCallback(
    (book: LibraryItem, entityIndex: number) => (
      <CollectionBookCardShell
        libraryItem={book}
        cardWidth={layoutCardWidth}
        libraryId={library.id}
        bookshelfView={bookshelfView}
        showSubtitles={showSubtitles}
        seriesSortBy={seriesSortBy}
        mediaItemProgressMap={mediaItemProgressMap}
        shelfEntities={shelfEntitiesDense}
        entityIndex={entityIndex}
        showDragHandle={false}
      />
    ),
    [bookshelfView, layoutCardWidth, library.id, mediaItemProgressMap, seriesSortBy, shelfEntitiesDense, showSubtitles]
  )

  const visibleShelfStartResolved = visibleShelfStart
  const visibleShelfEndResolved = visibleShelfEnd

  const headerAlignsWithShelf = canLayoutShelf && columns > 0 && bookshelfRowWidth > 0

  return (
    <div className="mt-10 w-full min-w-0">
      {headerAlignsWithShelf ? (
        <div className="mx-auto max-w-full" style={{ width: bookshelfRowWidth }}>
          <div className="bg-primary/40 w-full overflow-hidden rounded-md">
            <div className="bg-primary flex h-14 items-center gap-3 px-3 py-2 md:px-4">
              <p className="text-foreground pr-2">{t('HeaderCollectionItems')}</p>
              <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/10 px-1.5 md:h-7 md:min-w-7">
                <span className="font-mono text-xs leading-none md:text-sm">{totalEntities}</span>
              </div>
              <div className="grow" />
              {totalDurationLabel ? <p className="text-foreground-muted text-sm">{totalDurationLabel}</p> : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-primary/40 w-full overflow-hidden rounded-md">
          <div className="bg-primary flex h-14 items-center gap-3 px-4 py-2 md:px-6">
            <p className="text-foreground pr-2">{t('HeaderCollectionItems')}</p>
            <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/10 px-1.5 md:h-7 md:min-w-7">
              <span className="font-mono text-xs leading-none md:text-sm">{totalEntities}</span>
            </div>
            <div className="grow" />
            {totalDurationLabel ? <p className="text-foreground-muted text-sm">{totalDurationLabel}</p> : null}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={
          isAlternativeBookshelfView
            ? 'relative min-h-[28rem] overflow-x-hidden overflow-y-auto py-4'
            : 'bookshelf-container relative min-h-[28rem] overflow-x-hidden overflow-y-auto'
        }
        style={{ fontSize: sizeMultiplier + 'rem' }}
        onScroll={(e) => {
          if (!canReorder) {
            handleScroll(e.currentTarget.scrollTop)
          }
        }}
      >
        <div ref={dummyCardRef} className="w-max" style={{ position: 'absolute', visibility: 'hidden', top: 0, left: 0, zIndex: -1 }} aria-hidden="true">
          <itemsConfig.SkeletonComponent bookshelfView={bookshelfView} seriesSortBy={seriesSortBy} showSubtitles={showSubtitles} orderBy={orderBy} />
        </div>

        {canLayoutShelf && totalEntities === 0 && (
          <div className="text-foreground-muted flex items-center justify-center p-10">
            <p>{t('MessageNoBooksFound')}</p>
          </div>
        )}

        {canLayoutShelf && totalEntities > 0 && canReorder && columns > 0 && (
          <CollectionBookshelfReorderGrid
            books={orderedBooks}
            setBooks={setOrderedBooks}
            collectionId={collection.id}
            columns={columns}
            cardWidth={layoutCardWidth}
            cardMargin={cardMargin}
            dividerHeight={dividerHeight}
            sizeMultiplier={sizeMultiplier}
            bookshelfMarginLeft={bookshelfMarginLeft}
            libraryId={library.id}
            bookshelfView={bookshelfView}
            showSubtitles={showSubtitles}
            seriesSortBy={seriesSortBy}
            mediaItemProgressMap={mediaItemProgressMap}
          />
        )}

        {canLayoutShelf && totalEntities > 0 && !canReorder && (
          <div className="relative w-full" style={{ height: totalShelves === 0 ? 'unset' : `${totalShelves * shelfHeight}px` }}>
            {Array.from({ length: visibleShelfEndResolved - visibleShelfStartResolved }).map((_, i) => {
              const shelfIndex = visibleShelfStartResolved + i
              const startIndex = shelfIndex * columns
              const shelfItems: LibraryItem[] = []
              for (let k = 0; k < columns; k++) {
                const itemIndex = startIndex + k
                if (itemIndex < totalEntities) {
                  shelfItems.push(orderedBooks[itemIndex])
                }
              }

              return (
                <div
                  key={shelfIndex}
                  className={`absolute left-0 flex w-full ${!isAlternativeBookshelfView ? 'bookshelfRow' : ''}`}
                  style={{
                    top: `${shelfIndex * shelfHeight}px`,
                    height: `${shelfHeight}px`,
                    paddingLeft: `${bookshelfMarginLeft}px`,
                    paddingTop: !isAlternativeBookshelfView ? `${16 * sizeMultiplier}px` : undefined,
                    gap: `${cardMargin}px`
                  }}
                >
                  {shelfItems.map((book, k) => {
                    const entityIndex = startIndex + k
                    return <div key={book.id}>{renderCard(book, entityIndex)}</div>
                  })}
                  {!isAlternativeBookshelfView && <div className="bookshelfDivider h-6e absolute right-0 bottom-0 left-0 z-20 w-full" />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
