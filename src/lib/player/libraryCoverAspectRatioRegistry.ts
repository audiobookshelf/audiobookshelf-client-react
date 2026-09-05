import { getCoverAspectRatio } from '@/lib/coverUtils'

const coverAspectRatioByLibraryId = new Map<string, 0 | 1>()

export function registerLibraryCoverAspectRatio(libraryId: string, coverAspectRatio: 0 | 1 | undefined) {
  if (!libraryId) return
  if (coverAspectRatio === undefined) {
    coverAspectRatioByLibraryId.delete(libraryId)
    return
  }
  coverAspectRatioByLibraryId.set(libraryId, coverAspectRatio)
}

export function registerLibrariesCoverAspectRatio(libraries: { id: string; settings?: { coverAspectRatio?: 0 | 1 } }[]) {
  for (const library of libraries) {
    registerLibraryCoverAspectRatio(library.id, library.settings?.coverAspectRatio)
  }
}

/** Standard (1.6) when the stream library has not been registered yet. */
export function getRegisteredLibraryCoverAspectRatio(libraryId: string): number {
  return getCoverAspectRatio(coverAspectRatioByLibraryId.get(libraryId) ?? 0)
}
