'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { mergeClasses } from '@/lib/merge-classes'

interface UploadLayoutWrapperProps {
  children: React.ReactNode
}

export default function UploadLayoutWrapper({ children }: UploadLayoutWrapperProps) {
  const { libraryItemIdStreaming } = useMediaContext()

  return (
    <div className={mergeClasses('page-wrapper flex overflow-x-hidden', libraryItemIdStreaming ? 'streaming' : '')}>
      <div className="page-bg-gradient min-w-0 flex-1">
        <div className="h-full w-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
