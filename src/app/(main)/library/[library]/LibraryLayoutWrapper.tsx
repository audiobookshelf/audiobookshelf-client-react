'use client'

import CoverSizeWidget from '@/components/widgets/CoverSizeWidget'
import { useMediaContext } from '@/contexts/MediaContext'
import { mergeClasses } from '@/lib/merge-classes'
import { Library, UserLoginResponse } from '@/types/api'
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

  return (
    <div className={mergeClasses('flex library-page-wrapper overflow-x-hidden', libraryItemIdStreaming ? 'streaming' : '')}>
      <SideRail
        currentLibraryId={currentLibrary.id}
        currentLibraryMediaType={currentLibraryMediaType}
        serverVersion={serverVersion}
        installSource={installSource}
      />
      <div className="flex-1 min-w-0 page-bg-gradient">
        <Toolbar currentLibrary={currentLibrary} />
        <div className="w-full h-[calc(100%-2.5rem)] overflow-x-hidden overflow-y-auto">{children}</div>
      </div>

      <CoverSizeWidget className="absolute bottom-4 right-4 z-50" />
    </div>
  )
}
