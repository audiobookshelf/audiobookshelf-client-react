'use client'

import Dropdown from '@/components/ui/Dropdown'
import LibraryIcon from '@/components/ui/LibraryIcon'
import { attemptGuardedNavigation } from '@/hooks/useUnsavedNavigationGuard'
import { mergeClasses } from '@/lib/merge-classes'
import { Library } from '@/types/api'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useTransition } from 'react'

// Match Vue LibrariesDropdown max width (max-w-52 = 13rem)
const LIBRARIES_DROPDOWN_MAX_WIDTH_CLASS = 'md:max-w-52'

interface LibrariesDropdownProps {
  libraries: Library[]
  currentLibraryId: string
}

const sharedPages = ['items', 'playlists', 'search', 'playlist']
const bookPages = ['series', 'collections', 'authors', 'narrators', 'stats', 'collection']
const podcastPages = ['latest', 'add-podcast', 'download-queue']

function pageAllowed(page: string, mediaType: Library['mediaType']) {
  return !page || sharedPages.includes(page) || (mediaType === 'book' && bookPages.includes(page)) || (mediaType === 'podcast' && podcastPages.includes(page))
}

function getLibrarySwitchPath(pathname: string, search: string, currentLibraryId: string, targetLibraryId: string, targetMediaType: Library['mediaType']) {
  const home = `/library/${targetLibraryId}`
  const fromPrefix = `/library/${currentLibraryId}`

  if (!pathname.startsWith(fromPrefix)) return home

  const parts = pathname.split('/').filter(Boolean)
  const page = parts[2]
  const hasDetailId = parts.length > 3

  if (page === 'series' && hasDetailId) {
    return targetMediaType === 'book' ? `${home}/series${search}` : home
  }
  if (page === 'authors' && hasDetailId) {
    return targetMediaType === 'book' ? `${home}/authors${search}` : home
  }
  if (page === 'collection' && hasDetailId) {
    return targetMediaType === 'book' ? `${home}/collections${search}` : home
  }
  if (page === 'playlist' && hasDetailId) {
    return `${home}/playlists${search}`
  }
  if (page === 'item' && hasDetailId) {
    return home
  }

  parts[1] = targetLibraryId
  const path = '/' + parts.join('/')
  return pageAllowed(page ?? '', targetMediaType) ? `${path}${search}` : home
}

export default function LibrariesDropdown({ libraries, currentLibraryId }: LibrariesDropdownProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const search = searchParams?.size ? `?${searchParams.toString()}` : ''

  const libraryItems = useMemo(
    () =>
      libraries.map((library) => ({
        text: library.name,
        value: library.id,
        leftIcon: <LibraryIcon icon={library.icon} decorative />
      })),
    [libraries]
  )

  const widestLibrary = useMemo(() => {
    if (!libraries.length) return null

    return libraries.reduce((longest, library) => (library.name.length > longest.name.length ? library : longest))
  }, [libraries])

  return (
    <div className={mergeClasses('relative min-w-0 md:grid md:w-fit', LIBRARIES_DROPDOWN_MAX_WIDTH_CLASS)}>
      {widestLibrary && (
        <span
          aria-hidden="true"
          className="pointer-events-none invisible col-start-1 row-start-1 hidden h-0 overflow-hidden whitespace-nowrap md:flex md:h-9 md:items-center md:overflow-visible md:rounded-md md:px-2 md:text-sm"
        >
          <span className="flex min-w-0 flex-1 items-center gap-1.5 ps-1">
            <LibraryIcon icon={widestLibrary.icon} decorative />
            <span className="font-sans">{widestLibrary.name}</span>
          </span>
          <span className="material-symbols pointer-events-none ms-3 shrink-0 text-2xl">expand_more</span>
        </span>
      )}
      <div className="col-start-1 row-start-1 min-w-0">
        <Dropdown
          items={libraryItems}
          hideSelectedInMenu
          menuMaxHeight="80vh"
          size="small"
          disabled={isPending}
          value={currentLibraryId}
          usePortal
          onChange={(value) => {
            const lib = libraries.find((l) => l.id === value)
            if (!lib || lib.id === currentLibraryId) return

            const path = getLibrarySwitchPath(pathname, search, currentLibraryId, lib.id, lib.mediaType)
            if (!attemptGuardedNavigation(path)) return

            startTransition(() => {
              router.push(path)
            })
          }}
        />
      </div>
    </div>
  )
}
