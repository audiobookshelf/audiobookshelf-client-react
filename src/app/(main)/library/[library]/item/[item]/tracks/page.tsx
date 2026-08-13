import TracksEditClient from '@/components/widgets/tracks-edit/TracksEditClient'
import { getCurrentUser, getData } from '@/lib/api'
import { getLibraryItemOrNotFound } from '@/lib/notFound'
import { userCanUpdate } from '@/lib/userPermissions'
import type { BookLibraryItem } from '@/types/api'
import { redirect } from 'next/navigation'

export default async function TracksPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId } = await params
  const [libraryItem, currentUser] = await getData(getLibraryItemOrNotFound(itemId, true), getCurrentUser())

  if (!currentUser) {
    redirect('/')
  }

  const itemPath = `/library/${libraryItem.libraryId}/item/${libraryItem.id}`
  const bookItem = libraryItem.mediaType === 'book' ? (libraryItem as BookLibraryItem) : null

  const audioFileCount = bookItem?.media.audioFiles?.length ?? 0

  if (!userCanUpdate(currentUser.user) || !bookItem || libraryItem.isFile || audioFileCount <= 1) {
    redirect(itemPath)
  }

  return <TracksEditClient libraryItem={bookItem} />
}
