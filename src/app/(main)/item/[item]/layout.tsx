import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../../assets/globals.css'
import { getCurrentUser, getData, getLibraries, getLibraryItem } from '../../../../lib/api'
import AppBar from '../../AppBar'

import LibraryItemLayoutWrapper from './LibraryItemLayoutWrapper'

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
  const libraries = librariesResponse?.libraries || []

  return (
    <>
      <AppBar user={currentUser.user} libraries={libraries} currentLibraryId={libraryItem.libraryId} />
      <LibraryItemLayoutWrapper currentUser={currentUser} libraryItem={libraryItem}>
        {children}
      </LibraryItemLayoutWrapper>
    </>
  )
}
