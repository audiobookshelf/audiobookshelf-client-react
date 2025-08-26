'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Dropdown from '@/components/ui/Dropdown'

interface LibrariesDropdownProps {
  libraries: any[]
  currentLibraryId: string
}

const bookLibraryPages = ['bookshelf', 'series', 'collections', 'playlists', 'authors', 'narrators', 'stats']
const podcastLibraryPages = ['bookshelf', 'latest', 'playlists', 'search', 'download-queue']

export default function LibrariesDropdown({ libraries, currentLibraryId }: LibrariesDropdownProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function getLibraryPath(libraryId: string) {
    const library = libraries.find((l) => l.id === libraryId)
    let page = pathname.split('/').pop() || ''
    if (page && library.mediaType === 'book' && !bookLibraryPages.includes(page)) {
      page = ''
    } else if (page && library.mediaType === 'podcast' && !podcastLibraryPages.includes(page)) {
      page = ''
    }

    return `/library/${libraryId}/${page}`
  }

  const libraryItems = libraries.map((library) => ({
    text: library.name,
    value: library.id
  }))

  return (
    <div className="relative w-48">
      <Dropdown
        items={libraryItems}
        menuMaxHeight="80vh"
        size="small"
        disabled={isPending}
        value={currentLibraryId}
        onChange={(value) => {
          startTransition(() => {
            router.push(getLibraryPath(String(value)))
          })
        }}
      />
    </div>
  )
}
