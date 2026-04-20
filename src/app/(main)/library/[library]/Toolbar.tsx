'use client'

import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { usePathname } from 'next/navigation'

// Pages that should show item count and toolbar extras
const BOOKSHELF_PAGE_PATTERNS = ['/items', '/series', '/collections', '/playlists', '/authors']

export default function Toolbar() {
  const pathname = usePathname()
  const { library, itemCount, detailToolbarTitle, contextMenuItems, onContextMenuAction, toolbarExtras, filterBy } = useLibrary()
  const t = useTypeSafeTranslations()

  // Check if we're on any bookshelf-like page
  const isBookshelfPage = BOOKSHELF_PAGE_PATTERNS.some((pattern) => pathname.endsWith(pattern))

  const isBookshelfEmpty = itemCount === 0 && filterBy === 'all'

  const isSeriesDetailPage = Boolean(detailToolbarTitle)

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

  const showBookshelfSummary = isBookshelfPage && itemCount !== null && !isSeriesDetailPage
  const showSeriesDetailSummary = isSeriesDetailPage && itemCount !== null
  const showToolbarExtras = isBookshelfPage && !isBookshelfEmpty && !isSeriesDetailPage
  const showContextMenu = contextMenuItems.length > 0 && (!isBookshelfEmpty || isSeriesDetailPage)

  return (
    <div className="bg-bg box-shadow-toolbar relative z-40 h-10 w-full" cy-id="library-toolbar">
      <div className="flex h-full w-full items-center justify-between px-4">
        {showBookshelfSummary && (
          <p className="text-foreground hidden text-base md:block">
            {itemCount} {itemName}
          </p>
        )}

        {showSeriesDetailSummary && (
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="text-foreground truncate text-base" title={detailToolbarTitle ?? ''}>
              <span>{detailToolbarTitle}</span>
              <span className="text-foreground-muted"> {itemCount ? `(${itemCount})` : ''}</span>
            </p>
          </div>
        )}

        <div className="flex-grow" />

        {showToolbarExtras && <div className="mr-2 flex items-center gap-4">{toolbarExtras}</div>}

        {showContextMenu && (
          <ContextMenuDropdown items={contextMenuItems} borderless usePortal size="small" autoWidth onAction={(args) => handleAction(args.action)} />
        )}
      </div>
    </div>
  )
}
