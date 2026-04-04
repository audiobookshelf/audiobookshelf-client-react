'use client'

import CoverSizeWidget from '@/components/widgets/CoverSizeWidget'
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
  const { library } = useLibrary()
  const serverVersion = serverSettings?.version || 'Error'
  const installSource = Source || 'Unknown'
  const isLibraryItemPage = usePathname().includes('/item/')

  useEffect(() => {
    if (library) {
      setLastCurrentLibraryId(library.id)
    }
  }, [library, setLastCurrentLibraryId])

  return (
    <div className={mergeClasses('page-wrapper relative flex overflow-hidden', libraryItemIdStreaming ? 'streaming' : '')}>
      <SideRail serverVersion={serverVersion} installSource={installSource} />
      <div className="page-bg-gradient min-w-0 flex-1 overflow-hidden">
        {!isLibraryItemPage && <Toolbar />}
        {/* subtract height of toolbar if not library item page */}
        <div className={mergeClasses('w-full overflow-x-hidden overflow-y-auto', isLibraryItemPage ? 'h-full' : 'h-[calc(100%-2.5rem)]')}>{children}</div>
      </div>

      {!isLibraryItemPage && <CoverSizeWidget className="absolute right-4 bottom-4 z-50" />}
    </div>
  )
}
