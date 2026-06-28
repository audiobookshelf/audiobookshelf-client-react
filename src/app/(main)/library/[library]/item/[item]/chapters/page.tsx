import ChaptersEditClient from '@/components/widgets/chapters-edit/ChaptersEditClient'
import { getCurrentUser, getData, getLibraryItem } from '@/lib/api'
import { userCanUpdate } from '@/lib/userPermissions'
import type { BookLibraryItem } from '@/types/api'
import { redirect } from 'next/navigation'

export default async function ChaptersPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId } = await params
  const [libraryItem, currentUser] = await getData(getLibraryItem(itemId, true), getCurrentUser())

  if (!libraryItem || !currentUser) {
    redirect('/')
  }

  const itemPath = `/library/${libraryItem.libraryId}/item/${libraryItem.id}`
  const bookItem = libraryItem.mediaType === 'book' ? (libraryItem as BookLibraryItem) : null

  if (!userCanUpdate(currentUser.user) || !bookItem?.media.tracks?.length) {
    redirect(itemPath)
  }

  return <ChaptersEditClient libraryItem={bookItem} />
}
