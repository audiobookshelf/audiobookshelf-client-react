'use client'

import { useLibrary } from '@/contexts/LibraryContext'
import type { Library } from '@/types/api'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function isLibraryIssuesPage(pathname: string): boolean {
  return pathname.endsWith('/issues')
}

const LIBRARY_SHARED_PAGES = ['items', 'issues', 'playlists', 'search', 'playlist', 'item', 'batch', 'upload']
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
  const searchParams = useSearchParams()
  const { library, filterData, filterDataLoading } = useLibrary()

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] !== 'library' || segments[1] !== library.id) return

    const page = segments[2] ?? ''

    // If manually navigated to filter by issues on items page, redirect to issues page
    if (page === 'items' && searchParams.get('filter') === 'issues') {
      router.replace(`/library/${library.id}/issues`)
      return
    }

    if (page && !isLibraryPageAllowed(page, library.mediaType)) {
      router.replace(`/library/${library.id}`)
      return
    }

    if (isLibraryIssuesPage(pathname)) {
      if (filterDataLoading || filterData === null) return
      if ((filterData.numIssues ?? 0) === 0) {
        router.replace(`/library/${library.id}`)
      }
    }
  }, [pathname, library, filterData, filterDataLoading, router, searchParams])
}
