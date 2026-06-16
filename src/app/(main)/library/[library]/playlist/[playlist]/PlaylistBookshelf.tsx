'use client'

import { ENTITY_CONFIGS } from '@/app/(main)/library/[library]/[entityType]/entity-config'
import { updatePlaylistAction } from '@/app/actions/playlistActions'
import CompilationBookshelf from '@/components/widgets/compilation/CompilationBookshelf'
import { useLibrary } from '@/contexts/LibraryContext'
import { getSortableBookshelfItemOrderBy } from '@/contexts/SortableBookshelfOverlayContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { buildMediaItemProgressMap } from '@/lib/mediaProgress'
import { playlistItemsToPayload, toSortablePlaylistItems } from '@/lib/playlistItems'
import type { BookshelfEntity, Playlist, PlaylistItem } from '@/types/api'
import type { SortableBookshelfEntry } from '@/types/compilation'
import { BookshelfView } from '@/types/api'
import { useCallback, useMemo } from 'react'

const itemsConfig = ENTITY_CONFIGS.items
const bookshelfView = BookshelfView.DETAIL

interface PlaylistBookshelfProps {
  playlist: Playlist
  orderedItems: PlaylistItem[]
  setOrderedItems: (next: PlaylistItem[]) => void
  showReorder: boolean
}

function entriesToPlaylistItems(entries: SortableBookshelfEntry[]): PlaylistItem[] {
  return entries.map((e) => ({
    libraryItemId: e.libraryItem.id,
    libraryItem: e.libraryItem,
    episodeId: e.episode?.id,
    episode: e.episode
  }))
}

export default function PlaylistBookshelf({ playlist, orderedItems, setOrderedItems, showReorder }: PlaylistBookshelfProps) {
  const t = useTypeSafeTranslations()
  const { user } = useUser()
  const { library, showSubtitles, seriesSortBy } = useLibrary()
  const isPodcastLibrary = library.mediaType === 'podcast'

  const shelfEntries = useMemo(() => toSortablePlaylistItems(orderedItems), [orderedItems])
  const shelfEntitiesDense = useMemo(() => orderedItems.map((i) => i.libraryItem) as unknown as (BookshelfEntity | null)[], [orderedItems])
  const mediaItemProgressMap = useMemo(() => buildMediaItemProgressMap(user.mediaProgress), [user.mediaProgress])

  const handlePersistOrder = useCallback(
    async (entries: SortableBookshelfEntry[]) => {
      const items = entriesToPlaylistItems(entries)
      await updatePlaylistAction(playlist.id, { items: playlistItemsToPayload(items) })
    },
    [playlist.id]
  )

  const handleSetShelfEntries = useCallback(
    (entries: SortableBookshelfEntry[]) => {
      setOrderedItems(entriesToPlaylistItems(entries))
    },
    [setOrderedItems]
  )

  const renderCard = useCallback(
    (entry: SortableBookshelfEntry, entityIndex: number, layoutCardWidth: number) => (
      <itemsConfig.CardComponent
        entity={entry.libraryItem}
        episode={entry.episode}
        bookshelfView={bookshelfView}
        width={layoutCardWidth}
        libraryId={library.id}
        isPodcastLibrary={isPodcastLibrary}
        showSubtitles={showSubtitles}
        orderBy={getSortableBookshelfItemOrderBy(entry.libraryItem)}
        seriesSortBy={seriesSortBy}
        mediaItemProgressMap={mediaItemProgressMap}
        shelfEntities={shelfEntitiesDense}
        entityIndex={entityIndex}
      />
    ),
    [isPodcastLibrary, library.id, mediaItemProgressMap, seriesSortBy, shelfEntitiesDense, showSubtitles]
  )

  return (
    <CompilationBookshelf
      entries={shelfEntries}
      setEntries={handleSetShelfEntries}
      onPersistOrder={handlePersistOrder}
      showReorder={showReorder}
      emptyMessage={t('MessageNoItemsFound')}
      isPodcastLibrary={isPodcastLibrary}
      renderCard={renderCard}
    />
  )
}
