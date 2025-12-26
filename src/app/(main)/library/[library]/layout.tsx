import { LibraryProvider } from '@/contexts/LibraryContext'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../../assets/globals.css'
import { getCurrentUser, getData, getLibraries } from '../../../../lib/api'
import AppBar from '../../AppBar'
import LibraryLayoutWrapper from './LibraryLayoutWrapper'

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

  const libraries = librariesResponse?.libraries || []
  const currentLibrary = libraries.find((library) => library.id === currentLibraryId)
  if (!currentLibrary) {
    console.error('Error getting library data')
    redirect(`/`)
  }

  const homeBookshelfView = currentUser?.serverSettings?.homeBookshelfView || 0 // Default to STANDARD if undefined

  return (
    <LibraryProvider bookshelfView={homeBookshelfView} library={currentLibrary}>
      <AppBar user={currentUser.user} libraries={libraries} currentLibraryId={currentLibraryId} />
      <LibraryLayoutWrapper currentUser={currentUser}>{children}</LibraryLayoutWrapper>
    </LibraryProvider>
  )
}
