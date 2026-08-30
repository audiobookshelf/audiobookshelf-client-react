'use client'

import { getCoverSizeWidgetBottomClass } from '@/components/player/MediaPlayerContainer'
import CoverSizeWidget from '@/components/widgets/CoverSizeWidget'
import { useBookshelfSelection } from '@/contexts/BookshelfSelectionContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useAppNavigation } from '@/contexts/AppNavigationContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { useUser } from '@/contexts/UserContext'
import { useLibraryRouteGuard } from '@/hooks/useLibraryRouteGuard'
import { mergeClasses } from '@/lib/merge-classes'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import SideRail from '../../SideRail'
import Toolbar from './Toolbar'

interface LibraryLayoutWrapperProps {
  children: React.ReactNode
}

export default function LibraryLayoutWrapper({ children }: LibraryLayoutWrapperProps) {
  const { libraryItemIdStreaming } = useMediaContext()
  const { setLastCurrentLibraryId } = useAppNavigation()
  const { Source, serverSettings } = useUser()
  const { library, boundModal, setBoundModal } = useLibrary()
  const { clearSelection, isSelectionMode } = useBookshelfSelection()
  const pathname = usePathname()
  const serverVersion = serverSettings?.version || 'Error'
  const installSource = Source || 'Unknown'
  const isLibraryItemPage = pathname.includes('/item/')
  const isBatchEditPage = pathname.endsWith('/batch')
  const isStatsPage = pathname.endsWith('/stats')
  const isUploadPage = pathname.endsWith('/upload')
  const showToolbar = !isLibraryItemPage && !isBatchEditPage && !isStatsPage && !isUploadPage
  const showCoverSizeWidget =
    !isLibraryItemPage &&
    !pathname.endsWith('/latest') &&
    !pathname.endsWith('/download-queue') &&
    !pathname.endsWith('/stats') &&
    !pathname.endsWith('/narrators') &&
    !isUploadPage &&
    !isBatchEditPage

  useLibraryRouteGuard()

  useEffect(() => {
    if (library) {
      setLastCurrentLibraryId(library.id)
    }
  }, [library, setLastCurrentLibraryId])

  useEffect(() => {
    setBoundModal(null)
    clearSelection()
  }, [pathname, setBoundModal, clearSelection])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSelectionMode) {
        event.preventDefault()
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearSelection, isSelectionMode])

  return (
    <div className={mergeClasses('page-wrapper relative flex overflow-hidden', libraryItemIdStreaming ? 'streaming' : '')}>
      <SideRail serverVersion={serverVersion} installSource={installSource} />
      <div className="page-bg-gradient min-w-0 flex-1 overflow-hidden">
        {showToolbar && <Toolbar />}
        {/* subtract height of toolbar when it is shown */}
        <div
          className={mergeClasses(
            'w-full overflow-x-hidden',
            showToolbar && 'h-[calc(100%-2.5rem)] overflow-y-auto',
            !showToolbar && isBatchEditPage && 'h-full overflow-hidden',
            !showToolbar && !isBatchEditPage && 'h-full overflow-y-auto'
          )}
        >
          {children}
        </div>
      </div>

      {showCoverSizeWidget && <CoverSizeWidget className={mergeClasses('fixed right-4 z-[60]', getCoverSizeWidgetBottomClass(!!libraryItemIdStreaming))} />}
      {boundModal}
    </div>
  )
}
