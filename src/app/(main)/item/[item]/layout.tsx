import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getLibraries, getCurrentUser, getLibraryItem, getData } from '../../../../lib/api'
import '../../../../assets/globals.css'
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

  const [librariesResponse, userResponse, itemResponse] = await getData(getLibraries(), getCurrentUser(), getLibraryItem(libraryItemId))

  if (userResponse.error || !userResponse.data?.user) {
    console.error('Error getting user data:', userResponse)
    redirect(`/login`)
  }

  if (itemResponse.error || !itemResponse.data) {
    console.error('Error getting item data:', itemResponse)
    return null
  }

  const installSource = userResponse.data?.Source || 'Unknown'
  const serverVersion = userResponse.data?.serverSettings?.version || 'Error'
  const libraries = librariesResponse.data?.libraries || []

  const libraryItem = itemResponse.data

  const currentLibrary = libraries.find((library: any) => library.id === libraryItem.libraryId)
  const currentLibraryMediaType = currentLibrary?.mediaType || 'book'

  return (
    <>
      <AppBar user={userResponse.data.user} libraries={libraries} currentLibraryId={libraryItem.libraryId} />
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
