'use client'

import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import { useBookshelfSelection } from '@/contexts/BookshelfSelectionContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { usePathname, useSearchParams } from 'next/navigation'

// Pages that should show item count and toolbar extras
const BOOKSHELF_PAGE_PATTERNS = ['/items', '/series', '/collections', '/playlists', '/authors']

export default function Toolbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { library, itemCount, itemCountSupplement, detailToolbarTitle, contextMenuItems, onContextMenuAction, toolbarExtras, filterBy } = useLibrary()
  const { isSelectionMode } = useBookshelfSelection()
  const t = useTypeSafeTranslations()

  const isSearchPage = pathname.endsWith('/search')
  const searchQuery = searchParams.get('q')?.trim() ?? ''

  // Check if we're on any bookshelf-like page (or a single collection, which syncs the same summary fields)
  const isBookshelfPage = BOOKSHELF_PAGE_PATTERNS.some((pattern) => pathname.endsWith(pattern))
  const isCollectionDetailPage = pathname.includes('/collection/')
  const isPlaylistDetailPage = pathname.includes('/playlist/')

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
  } else if (pathname.endsWith('/items') || isCollectionDetailPage || isPlaylistDetailPage) {
    if (library?.mediaType === 'podcast') {
      itemName = isPlaylistDetailPage ? t('LabelEpisodes') : t('LabelPodcasts')
    } else if (library?.mediaType === 'book') {
      itemName = t('LabelBooks')
    }
  }

  const handleAction = (action: string) => {
    onContextMenuAction?.(action)
  }

  const showBookshelfSummary = !isSearchPage && (isBookshelfPage || isCollectionDetailPage || isPlaylistDetailPage) && itemCount !== null && !isSeriesDetailPage
  const showSeriesDetailSummary = !isSearchPage && isSeriesDetailPage && itemCount !== null
  const showSearchSummary = isSearchPage && searchQuery
  const showToolbarExtras = isBookshelfPage && !isBookshelfEmpty && !isSeriesDetailPage && !isSearchPage && !isSelectionMode
  const showContextMenu = contextMenuItems.length > 0 && (!isBookshelfEmpty || isSeriesDetailPage) && !isSearchPage && !isSelectionMode

  return (
    <div className="bg-bg box-shadow-toolbar relative z-40 h-10 w-full" cy-id="library-toolbar">
      <div className="flex h-full w-full items-center justify-between px-4">
        {showSearchSummary && (
          <>
            <div className="flex-grow" />
            <p className="text-foreground text-base">
              {t('MessageSearchResultsFor')} &quot;{searchQuery}&quot;
            </p>
            <div className="flex-grow" />
          </>
        )}

        {showBookshelfSummary && (
          <p className="text-foreground hidden text-base md:block">
            <span>
              {itemCount} {itemName}
            </span>
            {itemCountSupplement ? <span className="text-foreground-muted">{itemCountSupplement}</span> : null}
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

        {!showSearchSummary && <div className="flex-grow" />}

        {showToolbarExtras && <div className="mr-2 flex items-center gap-4">{toolbarExtras}</div>}

        {showContextMenu && (
          <ContextMenuDropdown items={contextMenuItems} borderless usePortal size="small" autoWidth onAction={(args) => handleAction(args.action)} />
        )}
      </div>
    </div>
  )
}
