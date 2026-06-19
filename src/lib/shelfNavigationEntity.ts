import type { BookshelfEntity, LibraryItem, PlaylistItem, PodcastEpisode } from '@/types/api'

/** Shelf snapshot for modal prev/next: main-library entities or playlist compilation rows. */
export type ShelfNavigationEntity = BookshelfEntity | PlaylistItem

export function isPlaylistItem(entity: ShelfNavigationEntity): entity is PlaylistItem {
  return typeof (entity as PlaylistItem).libraryItemId === 'string' && 'libraryItem' in entity && !('id' in entity)
}

function isLibraryItemEntity(entity: ShelfNavigationEntity): entity is LibraryItem {
  return 'id' in entity && 'libraryId' in entity && 'media' in entity
}

export function getShelfEntityNavigationId(entity: ShelfNavigationEntity): string {
  if (isPlaylistItem(entity)) return entity.libraryItemId
  return entity.id
}

export function getShelfEntityEpisode(entity: ShelfNavigationEntity): PodcastEpisode | null | undefined {
  if (isPlaylistItem(entity)) return entity.episode ?? null
  if (isLibraryItemEntity(entity)) return entity.recentEpisode ?? null
  return null
}
