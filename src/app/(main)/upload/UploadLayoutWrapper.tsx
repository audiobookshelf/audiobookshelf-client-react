'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { mergeClasses } from '@/lib/merge-classes'

interface UploadLayoutWrapperProps {
  children: React.ReactNode
}

export default function UploadLayoutWrapper({ children }: UploadLayoutWrapperProps) {
  const { libraryItemIdStreaming } = useMediaContext()

  return (
    <div className={mergeClasses('flex page-wrapper overflow-x-hidden', libraryItemIdStreaming ? 'streaming' : '')}>
      <div className="flex-1 min-w-0 page-bg-gradient">
        <div className="w-full h-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
