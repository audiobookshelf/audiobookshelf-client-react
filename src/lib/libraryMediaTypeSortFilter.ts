import type { Library } from '@/types/api'

const PODCAST_INVALID_FILTER_PREFIXES = [
  'series',
  'authors',
  'narrators',
  'publishers',
  'publishedDecades',
  'languages',
  'progress',
  'issues',
  'ebooks',
  'abridged'
]
export interface LibrarySortFilterSettings {
  orderBy: string
  filterBy: string
}

export type LibrarySortFilterUpdates = Partial<LibrarySortFilterSettings>

/**
 * Returns setting updates when sort/filter are invalid for the library media type.
 * Matches Vue `user/checkUpdateLibrarySortFilter`.
 *
 * @param settings - The current sort/filter settings.
 * @param mediaType - The media type of the library.
 * @returns The updates to the sort/filter settings. May be empty if no updates are needed.
 */
export function getLibrarySortFilterUpdates(settings: LibrarySortFilterSettings, mediaType: Library['mediaType']): LibrarySortFilterUpdates {
  const updates: LibrarySortFilterUpdates = {}

  if (mediaType === 'podcast') {
    if (settings.orderBy === 'media.metadata.authorName' || settings.orderBy === 'media.metadata.authorNameLF') {
      updates.orderBy = 'media.metadata.author'
    }
    if (settings.orderBy === 'media.duration') {
      updates.orderBy = 'media.numTracks'
    }
    if (settings.orderBy === 'media.metadata.publishedYear' || settings.orderBy === 'progress') {
      updates.orderBy = 'media.metadata.title'
    }

    const filterByFirstPart = (settings.filterBy || '').split('.').shift() ?? ''
    if (PODCAST_INVALID_FILTER_PREFIXES.includes(filterByFirstPart)) {
      updates.filterBy = 'all'
    }
  } else {
    if (settings.orderBy === 'media.metadata.author') {
      updates.orderBy = 'media.metadata.authorName'
    }
    if (settings.orderBy === 'media.numTracks') {
      updates.orderBy = 'media.duration'
    }
    // Prevent stale issues filter before it was removed from the item page filter dropdown
    if (settings.filterBy === 'issues') {
      updates.filterBy = 'all'
    }
  }

  return updates
}

/**
 * Sanitizes sort/filter query params when switching libraries (Vue parity with checkUpdateLibrarySortFilter).
 *
 * @param pathname - The pathname of the current page.
 * @param search - The search query params.
 * @param mediaType - The media type of the library.
 * @returns The sanitized search query params.
 */
export function sanitizeLibrarySwitchSearch(pathname: string, search: string, mediaType: Library['mediaType']): string {
  if (!search) return ''

  const params = new URLSearchParams(search.slice(1))
  const filter = params.get('filter')
  const sort = params.get('sort')

  if (pathname.endsWith('/issues') && filter === 'issues') {
    params.delete('filter')
  }

  const updates = getLibrarySortFilterUpdates({ orderBy: sort ?? '', filterBy: filter ?? 'all' }, mediaType)

  if (filter && updates.filterBy === 'all') {
    params.delete('filter')
  }
  if (sort && updates.orderBy && updates.orderBy !== sort) {
    params.set('sort', updates.orderBy)
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}
