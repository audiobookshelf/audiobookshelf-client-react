import type { LibraryItem, PodcastEpisode } from '@/types/api'

/** View model for a single row/card in {@link SortableBookshelf}. */
export interface SortableBookshelfEntry {
  sortableId: string
  libraryItem: LibraryItem
  episode?: PodcastEpisode
}
