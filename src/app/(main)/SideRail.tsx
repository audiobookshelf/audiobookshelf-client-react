'use client'

import { useLibrary } from '@/contexts/LibraryContext'
import SideRailContent from './SideRailContent'

export default function SideRail({ serverVersion, installSource }: { serverVersion: string; installSource: string }) {
  const { library } = useLibrary()

  if (!library) {
    return null
  }

  return (
    <div className="bg-bg box-shadow-side z-10 hidden h-full max-h-[calc(100vh-4rem)] w-20 min-w-20 md:block">
      <SideRailContent libraryId={library.id} mediaType={library.mediaType} serverVersion={serverVersion} installSource={installSource} />
    </div>
  )
}
