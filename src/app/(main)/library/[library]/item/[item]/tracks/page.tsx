import TracksEditClient from '@/components/widgets/tracks-edit/TracksEditClient'
import { getCurrentUser, getData } from '@/lib/api'
import { getLibraryItemOrNotFound } from '@/lib/notFound'
import { namedPageMetadata } from '@/lib/pageMetadata'
import { userCanUpdate } from '@/lib/userPermissions'
import type { BookLibraryItem } from '@/types/api'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ item: string; library: string }> }): Promise<Metadata> {
  const { item: itemId } = await params
  const [libraryItem] = await getData(getLibraryItemOrNotFound(itemId, true))

  return namedPageMetadata(libraryItem.media.metadata.title, 'TitleAudiobookshelfItemTracks')
}

export default async function TracksPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId } = await params
  const [libraryItem, currentUser] = await getData(getLibraryItemOrNotFound(itemId, true), getCurrentUser())

  if (!libraryItem || !currentUser) {
    redirect('/library')
  }

  const itemPath = `/library/${libraryItem.libraryId}/item/${libraryItem.id}`
  const bookItem = libraryItem.mediaType === 'book' ? (libraryItem as BookLibraryItem) : null

  const audioFileCount = bookItem?.media.audioFiles?.length ?? 0

  if (!userCanUpdate(currentUser.user) || !bookItem || libraryItem.isFile || audioFileCount <= 1) {
    redirect(itemPath)
  }

  return <TracksEditClient libraryItem={bookItem} />
}
