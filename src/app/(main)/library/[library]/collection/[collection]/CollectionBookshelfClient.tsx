'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { CollectionBookshelfProvider, type CollectionBookshelfContext } from '@/contexts/CollectionBookshelfContext'
import { useBookCoverAspectRatio, useLibrary } from '@/contexts/LibraryContext'
import { useUser } from '@/contexts/UserContext'
import { useBookshelfVirtualizer } from '@/hooks/useBookshelfVirtualizer'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatDuration } from '@/lib/formatDuration'
import { buildMediaItemProgressMap } from '@/lib/mediaProgress'
import type { BookshelfEntity, Collection, LibraryItem } from '@/types/api'
import { BookshelfView } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ENTITY_CONFIGS } from '../../[entityType]/entity-config'
import CollectionBookCardShell from './CollectionBookCardShell'
import CollectionBookshelfReorderGrid from './CollectionBookshelfReorderGrid'

const itemsConfig = ENTITY_CONFIGS.items

interface CollectionBookshelfClientProps {
  collection: Collection
  /** When false on mobile, show browse grid without drag handles; desktop ignores this. */
  mobileReorderActive: boolean
}

export default function CollectionBookshelfClient({ collection, mobileReorderActive }: CollectionBookshelfClientProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { user, userCanUpdate } = useUser()
  const { library, orderBy, showSubtitles, seriesSortBy, setItemCount, setItemCountSupplement } = useLibrary()
  /** Detail (modern) bookshelf: titles and metadata in the card footer, not on the cover. */
  const bookshelfViewForCollection: BookshelfView = BookshelfView.DETAIL
  const isDetailBookshelfView = bookshelfViewForCollection === BookshelfView.DETAIL
  const { sizeMultiplier, isMobile } = useCardSize()
  const coverAspect = useBookCoverAspectRatio()
  const coverHeight = 192 * sizeMultiplier
  /** Same width as `MediaCard` / `MediaCardSkeleton` cover column (not the scrollport). */
  const nominalCoverWidth = coverHeight / coverAspect
  const canReorder = userCanUpdate

  const serverBookIds = useMemo(() => (collection.books ?? []).map((b) => b.id).join(','), [collection.books])

  const [orderedBooks, setOrderedBooks] = useState<LibraryItem[]>(() => collection.books ?? [])

  const handleBookRemovedFromCollection = useCallback(
    (libraryItemId: string) => {
      setOrderedBooks((prev) => prev.filter((b) => b.id !== libraryItemId))
      router.refresh()
    },
    [router]
  )

  const collectionBookshelf = useMemo<CollectionBookshelfContext>(
    () => ({
      collectionId: collection.id,
      onBookRemovedFromCollection: handleBookRemovedFromCollection
    }),
    [collection.id, handleBookRemovedFromCollection]
  )

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

  useEffect(() => {
    setItemCount(totalEntities)
    setItemCountSupplement(totalDurationLabel ? ` (${totalDurationLabel})` : null)
    return () => {
      setItemCount(null)
    }
  }, [totalEntities, totalDurationLabel, setItemCount, setItemCountSupplement])

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
  }, [library.settings?.coverAspectRatio, showSubtitles, sizeMultiplier, orderBy, bookshelfViewForCollection])

  useEffect(() => {
    setCardSize({ width: 0, height: 0 })
  }, [sizeMultiplier])

  const dividerHeight = isDetailBookshelfView ? 0 : 24

  /**
   * The hidden measurement node can incorrectly inherit the scrollport width; never treat a
   * measured width larger than the real cover column as the card width for column math.
   */
  const layoutCardWidth = useMemo(() => {
    if (cardSize.width <= 0) return nominalCoverWidth
    return Math.min(cardSize.width, nominalCoverWidth + 1)
  }, [cardSize.width, nominalCoverWidth])

  const estimatedCardBodyHeight = coverHeight + (isDetailBookshelfView ? 96 * sizeMultiplier : 0)
  const maxCardBodyHeight = coverHeight + (isDetailBookshelfView ? 220 : 48) * sizeMultiplier
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
  const { columns, columnGap } = useBookshelfVirtualizer({
    totalEntities,
    cardWidth: canLayoutShelf ? layoutCardWidth : 0,
    itemHeight: canLayoutShelf ? shelfRowHeight : 0,
    containerWidth: dimensions.width,
    containerHeight: dimensions.height
  })

  /** Pixel width of a full shelf row (N cards + N−1 gaps). */
  const bookshelfRowWidth = useMemo(() => {
    if (!canLayoutShelf || columns <= 0) return 0
    return columns * layoutCardWidth + Math.max(0, columns - 1) * columnGap
  }, [canLayoutShelf, columns, layoutCardWidth, columnGap])

  /** Centers the row in the scroll container; edge inset matches `columnGap` from `useBookshelfVirtualizer`. */
  const bookshelfMarginLeft = useMemo(() => {
    if (!canLayoutShelf || columns <= 0 || dimensions.width <= 0 || bookshelfRowWidth <= 0) return 0
    const innerWidth = Math.max(0, dimensions.width - 2 * columnGap)
    return columnGap + Math.max(0, (innerWidth - bookshelfRowWidth) / 2)
  }, [canLayoutShelf, columns, dimensions.width, bookshelfRowWidth, columnGap])

  const showReorderGrid = canReorder && columns > 0 && (!isMobile || mobileReorderActive)
  const showBrowseGrid = canLayoutShelf && totalEntities > 0 && columns > 0 && !showReorderGrid

  const browseGridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${columns}, ${layoutCardWidth}px)`,
      columnGap: `${columnGap}px`,
      rowGap: `${(16 + dividerHeight) * sizeMultiplier}px`,
      paddingLeft: `${bookshelfMarginLeft}px`,
      paddingRight: `${bookshelfMarginLeft}px`
    }),
    [bookshelfMarginLeft, columnGap, columns, dividerHeight, layoutCardWidth, sizeMultiplier]
  )

  const mediaItemProgressMap = useMemo(() => buildMediaItemProgressMap(user.mediaProgress), [user.mediaProgress])

  const shelfEntitiesDense = useMemo(() => orderedBooks as unknown as (BookshelfEntity | null)[], [orderedBooks])

  const renderCard = useCallback(
    (book: LibraryItem, entityIndex: number) => (
      <CollectionBookCardShell
        libraryItem={book}
        cardWidth={layoutCardWidth}
        libraryId={library.id}
        bookshelfView={bookshelfViewForCollection}
        showSubtitles={showSubtitles}
        seriesSortBy={seriesSortBy}
        mediaItemProgressMap={mediaItemProgressMap}
        shelfEntities={shelfEntitiesDense}
        entityIndex={entityIndex}
        showDragHandle={false}
      />
    ),
    [bookshelfViewForCollection, layoutCardWidth, library.id, mediaItemProgressMap, seriesSortBy, shelfEntitiesDense, showSubtitles]
  )

  return (
    <CollectionBookshelfProvider value={collectionBookshelf}>
      <div className="mt-10 w-full min-w-0">
        <div
          ref={containerRef}
          className={
            isDetailBookshelfView
              ? 'relative min-h-[28rem] overflow-x-hidden overflow-y-auto py-4'
              : 'bookshelf-container relative min-h-[28rem] overflow-x-hidden overflow-y-auto'
          }
          style={{ fontSize: sizeMultiplier + 'rem' }}
        >
          <div ref={dummyCardRef} className="w-max" style={{ position: 'absolute', visibility: 'hidden', top: 0, left: 0, zIndex: -1 }} aria-hidden="true">
            <itemsConfig.SkeletonComponent
              bookshelfView={bookshelfViewForCollection}
              seriesSortBy={seriesSortBy}
              showSubtitles={showSubtitles}
              orderBy={orderBy}
            />
          </div>

          {canLayoutShelf && totalEntities === 0 && (
            <div className="text-foreground-muted flex items-center justify-center p-10">
              <p>{t('MessageNoBooksFound')}</p>
            </div>
          )}

          {canLayoutShelf && totalEntities > 0 && showReorderGrid && (
            <CollectionBookshelfReorderGrid
              books={orderedBooks}
              setBooks={setOrderedBooks}
              collectionId={collection.id}
              columns={columns}
              cardWidth={layoutCardWidth}
              cardMargin={columnGap}
              dividerHeight={dividerHeight}
              sizeMultiplier={sizeMultiplier}
              bookshelfMarginLeft={bookshelfMarginLeft}
              libraryId={library.id}
              bookshelfView={bookshelfViewForCollection}
              showSubtitles={showSubtitles}
              seriesSortBy={seriesSortBy}
              mediaItemProgressMap={mediaItemProgressMap}
            />
          )}

          {showBrowseGrid && (
            <div className="grid w-full max-w-full min-w-0 pt-4" style={browseGridStyle}>
              {orderedBooks.map((book, entityIndex) => (
                <div key={book.id} className="flex justify-center overflow-visible">
                  {renderCard(book, entityIndex)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CollectionBookshelfProvider>
  )
}
