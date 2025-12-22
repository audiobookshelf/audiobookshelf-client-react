'use client'

import CoverSizeWidget from '@/components/widgets/CoverSizeWidget'
import { useMediaContext } from '@/contexts/MediaContext'
import { mergeClasses } from '@/lib/merge-classes'
import { Library, UserLoginResponse } from '@/types/api'
import { usePathname } from 'next/navigation'
import SideRail from '../../SideRail'
import Toolbar from './Toolbar'

interface LibraryLayoutWrapperProps {
  children: React.ReactNode
  currentUser: UserLoginResponse
  currentLibrary: Library
  currentLibraryMediaType: string
}

export default function LibraryLayoutWrapper({ children, currentUser, currentLibrary, currentLibraryMediaType }: LibraryLayoutWrapperProps) {
  const { libraryItemIdStreaming } = useMediaContext()
  const serverVersion = currentUser?.serverSettings?.version || 'Error'
  const installSource = currentUser?.Source || 'Unknown'
  const isLibraryItemPage = usePathname().includes('/item/')

  return (
    <div className={mergeClasses('flex page-wrapper overflow-hidden', libraryItemIdStreaming ? 'streaming' : '')}>
      <SideRail
        currentLibraryId={currentLibrary.id}
        currentLibraryMediaType={currentLibraryMediaType}
        serverVersion={serverVersion}
        installSource={installSource}
      />
      <div className="flex-1 min-w-0 page-bg-gradient overflow-hidden">
        {!isLibraryItemPage && <Toolbar currentLibrary={currentLibrary} />}
        {/* subtract height of toolbar if not library item page */}
        <div className={mergeClasses('w-full overflow-x-hidden overflow-y-auto', isLibraryItemPage ? 'h-full' : 'h-[calc(100%-2.5rem)]')}>{children}</div>
      </div>

      <CoverSizeWidget className="absolute bottom-4 right-4 z-50" />
    </div>
  )
}
