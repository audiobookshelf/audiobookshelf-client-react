import { LibraryItemsProvider } from '@/contexts/LibraryItemsContext'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../../assets/globals.css'
import { getCurrentUser, getData, getLibraries } from '../../../../lib/api'
import AppBar from '../../AppBar'
import SideRail from '../../SideRail'
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

  const [librariesResponse, currentUser] = await getData(getLibraries(), getCurrentUser())

  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  const installSource = currentUser?.Source || 'Unknown'
  const serverVersion = currentUser?.serverSettings?.version || 'Error'
  const libraries = librariesResponse?.libraries || []

  const currentLibrary = libraries.find((library: any) => library.id === currentLibraryId)
  const currentLibraryMediaType = currentLibrary?.mediaType || 'book'

  return (
    <LibraryItemsProvider>
      <AppBar user={currentUser.user} libraries={libraries} currentLibraryId={currentLibraryId} />
      <div className="flex h-[calc(100vh-4rem)] overflow-x-hidden">
        <SideRail
          currentLibraryId={currentLibraryId}
          currentLibraryMediaType={currentLibraryMediaType}
          serverVersion={serverVersion}
          installSource={installSource}
        />
        <div className="flex-1 min-w-0 page-bg-gradient">
          <Toolbar currentLibrary={currentLibrary} />
          <div className="w-full h-[calc(100%-2.5rem)] overflow-x-hidden overflow-y-auto">{children}</div>
        </div>
      </div>
    </LibraryItemsProvider>
  )
}
