'use client'

import { SortableBookshelfOverlayProvider } from '@/contexts/SortableBookshelfOverlayContext'
import { SortableCompilationProvider } from '@/contexts/SortableCompilationContext'
import { useCompilationSortableContext } from '@/hooks/useCompilationSortableContext'
import type { PlaylistDisplayMode } from '@/hooks/usePlaylistDisplayMode'
import type { Playlist, PlaylistItem } from '@/types/api'
import PlaylistBookshelf from './PlaylistBookshelf'
import PlaylistList from './PlaylistList'

interface PlaylistItemsProps {
  playlist: Playlist
  displayMode: PlaylistDisplayMode
  mobileReorderActive: boolean
  orderedItems: PlaylistItem[]
  setOrderedItems: (next: PlaylistItem[]) => void
  onItemRemoved: (libraryItemId: string, episodeId?: string | null) => void
}

export default function PlaylistItems({
  playlist,
  displayMode,
  mobileReorderActive,
  orderedItems,
  setOrderedItems,
  onItemRemoved
}: PlaylistItemsProps) {
  const { showReorder, sortableCompilation, bookshelfOverlayMode } = useCompilationSortableContext(
    playlist.id,
    'playlist',
    mobileReorderActive,
    onItemRemoved
  )

  return (
    <SortableCompilationProvider value={sortableCompilation}>
      {displayMode === 'bookshelf' ? (
        <SortableBookshelfOverlayProvider overlayMode={bookshelfOverlayMode}>
          <PlaylistBookshelf playlist={playlist} orderedItems={orderedItems} setOrderedItems={setOrderedItems} showReorder={showReorder} />
        </SortableBookshelfOverlayProvider>
      ) : (
        <PlaylistList playlist={playlist} orderedItems={orderedItems} setOrderedItems={setOrderedItems} showReorder={showReorder} />
      )}
    </SortableCompilationProvider>
  )
}
