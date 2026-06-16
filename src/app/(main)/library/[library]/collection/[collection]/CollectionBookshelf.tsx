'use client'

import { ENTITY_CONFIGS } from '@/app/(main)/library/[library]/[entityType]/entity-config'
import { updateCollectionAction } from '@/app/actions/collectionActions'
import CompilationBookshelf from '@/components/widgets/compilation/CompilationBookshelf'
import { useLibrary } from '@/contexts/LibraryContext'
import { getSortableBookshelfItemOrderBy } from '@/contexts/SortableBookshelfOverlayContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { buildMediaItemProgressMap } from '@/lib/mediaProgress'
import type { BookshelfEntity, Collection, LibraryItem } from '@/types/api'
import type { SortableBookshelfEntry } from '@/types/compilation'
import { BookshelfView } from '@/types/api'
import { useCallback, useMemo } from 'react'

const itemsConfig = ENTITY_CONFIGS.items
const bookshelfView = BookshelfView.DETAIL

function toSortableCollectionEntries(books: LibraryItem[]): SortableBookshelfEntry[] {
  return books.map((book) => ({ sortableId: book.id, libraryItem: book }))
}

interface CollectionBookshelfProps {
  collection: Collection
  orderedBooks: LibraryItem[]
  setOrderedBooks: (next: LibraryItem[]) => void
  showReorder: boolean
}

export default function CollectionBookshelf({ collection, orderedBooks, setOrderedBooks, showReorder }: CollectionBookshelfProps) {
  const t = useTypeSafeTranslations()
  const { user } = useUser()
  const { library, showSubtitles, seriesSortBy } = useLibrary()

  const shelfEntries = useMemo(() => toSortableCollectionEntries(orderedBooks), [orderedBooks])
  const shelfEntitiesDense = useMemo(() => orderedBooks as unknown as (BookshelfEntity | null)[], [orderedBooks])
  const mediaItemProgressMap = useMemo(() => buildMediaItemProgressMap(user.mediaProgress), [user.mediaProgress])

  const handlePersistOrder = useCallback(
    async (entries: SortableBookshelfEntry[]) => {
      await updateCollectionAction(collection.id, { books: entries.map((e) => e.libraryItem.id) })
    },
    [collection.id]
  )

  const handleSetShelfEntries = useCallback(
    (entries: SortableBookshelfEntry[]) => {
      setOrderedBooks(entries.map((e) => e.libraryItem))
    },
    [setOrderedBooks]
  )

  const renderCard = useCallback(
    (entry: SortableBookshelfEntry, entityIndex: number, layoutCardWidth: number) => (
      <itemsConfig.CardComponent
        entity={entry.libraryItem}
        bookshelfView={bookshelfView}
        width={layoutCardWidth}
        libraryId={library.id}
        isPodcastLibrary={false}
        showSubtitles={showSubtitles}
        orderBy={getSortableBookshelfItemOrderBy(entry.libraryItem)}
        seriesSortBy={seriesSortBy}
        mediaItemProgressMap={mediaItemProgressMap}
        shelfEntities={shelfEntitiesDense}
        entityIndex={entityIndex}
      />
    ),
    [library.id, mediaItemProgressMap, seriesSortBy, shelfEntitiesDense, showSubtitles]
  )

  return (
    <CompilationBookshelf
      entries={shelfEntries}
      setEntries={handleSetShelfEntries}
      onPersistOrder={handlePersistOrder}
      showReorder={showReorder}
      emptyMessage={t('MessageNoBooksFound')}
      renderCard={renderCard}
    />
  )
}
