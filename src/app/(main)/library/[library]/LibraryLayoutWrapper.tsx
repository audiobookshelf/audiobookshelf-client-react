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
    <div className={mergeClasses('relative flex page-wrapper overflow-hidden', libraryItemIdStreaming ? 'streaming' : '')}>
      <SideRail serverVersion={serverVersion} installSource={installSource} />
      <div className="flex-1 min-w-0 page-bg-gradient overflow-hidden">
        {!isLibraryItemPage && <Toolbar />}
        {/* subtract height of toolbar if not library item page */}
        <div className={mergeClasses('w-full overflow-x-hidden overflow-y-auto', isLibraryItemPage ? 'h-full' : 'h-[calc(100%-2.5rem)]')}>{children}</div>
      </div>

      {!isLibraryItemPage && <CoverSizeWidget className="absolute bottom-4 right-4 z-50" />}
    </div>
  )
}
