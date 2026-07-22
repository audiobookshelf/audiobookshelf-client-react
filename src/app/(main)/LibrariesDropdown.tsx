'use client'

import Dropdown from '@/components/ui/Dropdown'
import LibraryIcon from '@/components/ui/LibraryIcon'
import { attemptGuardedNavigation } from '@/hooks/useUnsavedNavigationGuard'
import { Library } from '@/types/api'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useTransition } from 'react'

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

  return (
    <div className="relative min-w-0">
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
  )
}
