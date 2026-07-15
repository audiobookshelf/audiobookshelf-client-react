'use client'

import CoverSizeWidget from '@/components/widgets/CoverSizeWidget'
import { useBookshelfSelection } from '@/contexts/BookshelfSelectionContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { useUser } from '@/contexts/UserContext'
import { mergeClasses } from '@/lib/merge-classes'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import SideRail from '../../SideRail'
import Toolbar from './Toolbar'

interface LibraryLayoutWrapperProps {
  children: React.ReactNode
}

export default function LibraryLayoutWrapper({ children }: LibraryLayoutWrapperProps) {
  const { libraryItemIdStreaming, setLastCurrentLibraryId } = useMediaContext()
  const { Source, serverSettings } = useUser()
  const { library, boundModal, setBoundModal } = useLibrary()
  const { clearSelection, isSelectionMode } = useBookshelfSelection()
  const pathname = usePathname()
  const serverVersion = serverSettings?.version || 'Error'
  const installSource = Source || 'Unknown'
  const isLibraryItemPage = pathname.includes('/item/')
  const isBatchEditPage = pathname.endsWith('/batch')
  const showCoverSizeWidget =
    !isLibraryItemPage &&
    !pathname.endsWith('/latest') &&
    !pathname.endsWith('/download-queue') &&
    !pathname.endsWith('/stats') &&
    !pathname.endsWith('/narrators') &&
    !isBatchEditPage

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
        {!isLibraryItemPage && !isBatchEditPage && <Toolbar />}
        {/* subtract height of toolbar if not library item page */}
        <div
          className={mergeClasses(
            'w-full overflow-x-hidden',
            isBatchEditPage && 'h-full overflow-hidden',
            isLibraryItemPage && !isBatchEditPage && 'h-full overflow-y-auto',
            !isLibraryItemPage && !isBatchEditPage && 'h-[calc(100%-2.5rem)] overflow-y-auto'
          )}
        >
          {children}
        </div>
      </div>

      {showCoverSizeWidget && <CoverSizeWidget className="absolute right-4 bottom-4 z-50" />}
      {boundModal}
    </div>
  )
}
