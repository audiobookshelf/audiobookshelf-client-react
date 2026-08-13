import AudiobookTools from '@/components/widgets/audiobook-tools/AudiobookTools'
import { getCurrentUser, getData } from '@/lib/api'
import { getLibraryItemOrNotFound } from '@/lib/notFound'
import { isUserAdminOrUp } from '@/lib/userPermissions'
import type { BookLibraryItem } from '@/types/api'
import { redirect } from 'next/navigation'

export default async function ToolsPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId } = await params
  const [libraryItem, currentUser] = await getData(getLibraryItemOrNotFound(itemId, true), getCurrentUser())

  if (!currentUser) {
    redirect('/')
  }

  const itemPath = `/library/${libraryItem.libraryId}/item/${libraryItem.id}`
  const bookItem = libraryItem.mediaType === 'book' ? (libraryItem as BookLibraryItem) : null

  if (!isUserAdminOrUp(currentUser.user.type) || !bookItem || !bookItem.media.tracks?.length) {
    redirect(itemPath)
  }

  return <AudiobookTools libraryItem={bookItem} />
}
