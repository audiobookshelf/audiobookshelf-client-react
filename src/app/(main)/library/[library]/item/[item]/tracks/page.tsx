import TracksEditClient from '@/components/widgets/tracks-edit/TracksEditClient'
import { getCurrentUser, getData, getLibraryItem } from '@/lib/api'
import { userCanUpdate } from '@/lib/userPermissions'
import type { BookLibraryItem } from '@/types/api'
import { redirect } from 'next/navigation'

export default async function TracksPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId } = await params
  const [libraryItem, currentUser] = await getData(getLibraryItem(itemId, true), getCurrentUser())

  if (!libraryItem || !currentUser) {
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
