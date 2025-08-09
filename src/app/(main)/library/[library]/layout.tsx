import type { Metadata } from 'next'
import { getLibraries } from '../../../../lib/api'
import '../../../../assets/globals.css'
import AppBar from '../../AppBar'
import SideRail from './SideRail'
import Toolbar from './Toolbar'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function LibraryLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ library: string }>
}>) {
  const { library: currentLibraryId } = await params

  const librariesResponse = await getLibraries()

  const libraries = librariesResponse.data?.libraries || []

  const currentLibrary = libraries.find((library: any) => library.id === currentLibraryId)
  const currentLibraryMediaType = currentLibrary?.mediaType || 'book'

  return (
    <>
      <AppBar libraries={libraries} currentLibraryId={currentLibraryId} />
      <div className="flex h-[calc(100vh-4rem)] overflow-x-hidden">
        <SideRail currentLibraryId={currentLibraryId} currentLibraryMediaType={currentLibraryMediaType} />
        <div className="flex-1 min-w-0">
          <Toolbar currentLibrary={currentLibrary} />
          <div className="w-full h-[calc(100%-2.5rem)] overflow-x-hidden overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  )
}
