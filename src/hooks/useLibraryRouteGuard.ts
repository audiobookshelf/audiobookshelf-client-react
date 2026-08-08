'use client'

import { useLibrary } from '@/contexts/LibraryContext'
import { isLibraryIssuesPage } from '@/lib/libraryIssuesPage'
import type { Library } from '@/types/api'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const LIBRARY_SHARED_PAGES = ['items', 'issues', 'playlists', 'search', 'playlist', 'item']
const LIBRARY_BOOK_PAGES = ['series', 'collections', 'authors', 'narrators', 'stats', 'collection']
const LIBRARY_PODCAST_PAGES = ['latest', 'add-podcast', 'download-queue']

export function isLibraryPageAllowed(page: string, mediaType: Library['mediaType']): boolean {
  if (!page) return true
  if (LIBRARY_SHARED_PAGES.includes(page)) return true
  if (mediaType === 'book' && LIBRARY_BOOK_PAGES.includes(page)) return true
  if (mediaType === 'podcast' && LIBRARY_PODCAST_PAGES.includes(page)) return true
  return false
}

/** Redirect when the current URL is invalid for the active library (e.g. after a library switch). */
export function useLibraryRouteGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const { library, filterData, filterDataLoading, updateSetting } = useLibrary()

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] !== 'library' || segments[1] !== library.id) return

    const page = segments[2] ?? ''

    if (page && !isLibraryPageAllowed(page, library.mediaType)) {
      router.replace(`/library/${library.id}`)
      return
    }

    if (isLibraryIssuesPage(pathname)) {
      if (filterDataLoading || filterData === null) return
      if ((filterData.numIssues ?? 0) === 0) {
        // Issues page sets filterBy to 'issues' and persists it; home redirect does not run useBookshelfQuery to reset it.
        updateSetting('filterBy', 'all')
        router.replace(`/library/${library.id}`)
      }
    }
  }, [pathname, library, filterData, filterDataLoading, router, updateSetting])
}
