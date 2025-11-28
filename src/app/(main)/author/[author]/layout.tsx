import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../../assets/globals.css'
import { getAuthor, getCurrentUser, getData, getLibraries } from '../../../../lib/api'
import AppBar from '../../AppBar'
import SideRail from '../../SideRail'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function AuthorLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ author: string }>
}>) {
  const { author: authorId } = await params

  const [librariesResponse, currentUser, author] = await getData(getLibraries(), getCurrentUser(), getAuthor(authorId))

  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  if (!author || !author.libraryId) {
    console.error('Error getting author data or author missing libraryId')
    return null
  }

  const installSource = currentUser?.Source || 'Unknown'
  const serverVersion = currentUser?.serverSettings?.version || 'Error'
  const libraries = librariesResponse?.libraries || []

  const currentLibrary = libraries.find((library) => library.id === author.libraryId)
  const currentLibraryMediaType = currentLibrary?.mediaType || 'book'

  return (
    <>
      <AppBar user={currentUser.user} libraries={libraries} currentLibraryId={author.libraryId} />
      <div className="flex h-[calc(100vh-4rem)] overflow-x-hidden">
        <SideRail
          currentLibraryId={author.libraryId}
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
