'use client'

import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { usePathname } from 'next/navigation'

// Pages that should show item count and toolbar extras
const BOOKSHELF_PAGE_PATTERNS = ['/items', '/series', '/collections', '/playlists', '/authors']

export default function Toolbar() {
  const pathname = usePathname()
  const { library, itemCount, contextMenuItems, onContextMenuAction, toolbarExtras, filterBy } = useLibrary()
  const t = useTypeSafeTranslations()

  // Check if we're on any bookshelf-like page
  const isBookshelfPage = BOOKSHELF_PAGE_PATTERNS.some((pattern) => pathname.endsWith(pattern))

  const isBookshelfEmpty = itemCount === 0 && filterBy === 'all'

  // Determine item name based on current page and library type
  let itemName = ''
  if (pathname.endsWith('/series')) {
    itemName = t('LabelSeries')
  } else if (pathname.endsWith('/collections')) {
    itemName = t('LabelCollections')
  } else if (pathname.endsWith('/playlists')) {
    itemName = t('LabelPlaylists')
  } else if (pathname.endsWith('/authors')) {
    itemName = t('LabelAuthors')
  } else if (pathname.endsWith('/items')) {
    if (library?.mediaType === 'podcast') {
      itemName = t('LabelPodcasts')
    } else if (library?.mediaType === 'book') {
      itemName = t('LabelBooks')
    }
  }
  const handleAction = (action: string) => {
    onContextMenuAction?.(action)
  }

  return (
    <div className="bg-bg box-shadow-toolbar relative z-40 h-10 w-full" cy-id="library-toolbar">
      <div className="flex h-full w-full items-center justify-between px-4">
        {isBookshelfPage && itemCount !== null && (
          <p className="text-foreground hidden text-base md:block">
            {itemCount} {itemName}
          </p>
        )}

        <div className="flex-grow" />

        {isBookshelfPage && !isBookshelfEmpty && <div className="mr-2 flex items-center gap-4">{toolbarExtras}</div>}

        {contextMenuItems.length > 0 && !isBookshelfEmpty && (
          <ContextMenuDropdown items={contextMenuItems} borderless usePortal size="small" autoWidth onAction={(args) => handleAction(args.action)} />
        )}
      </div>
    </div>
  )
}
