'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { mergeClasses } from '@/lib/merge-classes'
import { LibraryItem, UserLoginResponse } from '@/types/api'
import SideRail from '../../SideRail'

interface LibraryItemLayoutWrapperProps {
  currentUser: UserLoginResponse
  libraryItem: LibraryItem
  children: React.ReactNode
}

export default function LibraryItemLayoutWrapper({ currentUser, libraryItem, children }: LibraryItemLayoutWrapperProps) {
  const { libraryItemIdStreaming } = useMediaContext()
  const currentLibraryMediaType = libraryItem.mediaType
  const installSource = currentUser?.Source || 'Unknown'
  const serverVersion = currentUser?.serverSettings?.version || 'Error'

  return (
    <div className={mergeClasses('flex library-page-wrapper overflow-x-hidden', libraryItemIdStreaming ? 'streaming' : '')}>
      <SideRail
        currentLibraryId={libraryItem.libraryId}
        currentLibraryMediaType={currentLibraryMediaType}
        serverVersion={serverVersion}
        installSource={installSource}
      />
      <div className="flex-1 min-w-0 page-bg-gradient">
        <div className="w-full h-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
