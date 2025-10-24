import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../../assets/globals.css'
import { getCurrentUser, getData, getLibraries, getLibraryItem } from '../../../../lib/api'
import AppBar from '../../AppBar'
import SideRail from '../../SideRail'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function ItemLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ item: string }>
}>) {
  const { item: libraryItemId } = await params

  const [librariesResponse, currentUser, libraryItem] = await getData(getLibraries(), getCurrentUser(), getLibraryItem(libraryItemId))

  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  if (!libraryItem) {
    console.error('Error getting item data')
    return null
  }

  const installSource = currentUser?.Source || 'Unknown'
  const serverVersion = currentUser?.serverSettings?.version || 'Error'
  const libraries = librariesResponse?.libraries || []

  const currentLibrary = libraries.find((library: any) => library.id === libraryItem.libraryId)
  const currentLibraryMediaType = currentLibrary?.mediaType || 'book'

  return (
    <>
      <AppBar user={currentUser.user} libraries={libraries} currentLibraryId={libraryItem.libraryId} />
      <div className="flex h-[calc(100vh-4rem)] overflow-x-hidden">
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
    </>
  )
}
