import type { BookMedia, LibraryItem } from '@/types/api'
import { isBookMedia, isBookMetadata } from '@/types/api'

export function getBookDuration(media: BookMedia): number {
  const d = media.duration
  return typeof d === 'number' && Number.isFinite(d) ? d : 0
}

export function formatBookAuthorNames(media: BookMedia): string {
  if (!isBookMetadata(media.metadata)) return ''
  return (media.metadata.authors ?? []).map((author) => author.name).join(', ')
}

export function bookHasPlayableAudio(media: BookMedia): boolean {
  return (media.tracks ?? []).length > 0 || (media.numTracks ?? 0) > 0
}

export function isPlayableBook(libraryItem: LibraryItem): boolean {
  if (libraryItem.isMissing || libraryItem.isInvalid) return false
  const media = libraryItem.media
  if (!isBookMedia(media) || !isBookMetadata(media.metadata)) return false
  return bookHasPlayableAudio(media)
}
