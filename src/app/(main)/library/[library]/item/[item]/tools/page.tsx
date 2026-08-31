import AudiobookTools from '@/components/widgets/audiobook-tools/AudiobookTools'
import { getCurrentUser, getData } from '@/lib/api'
import { getLibraryItemOrNotFound } from '@/lib/notFound'
import { isUserAdminOrUp } from '@/lib/userPermissions'
import type { BookLibraryItem } from '@/types/api'
import { redirect } from 'next/navigation'

interface ToolsPageProps {
  params: Promise<{ item: string; library: string }>
  searchParams: Promise<{ tool?: string }>
}

export default async function ToolsPage({ params, searchParams }: ToolsPageProps) {
  const { item: itemId, library: libraryIdFromRoute } = await params
  const { tool } = await searchParams
  const [libraryItem, currentUser] = await getData(getLibraryItemOrNotFound(itemId, true), getCurrentUser())

  if (!libraryItem || !currentUser) {
    redirect('/library')
  }

  const itemPath = `/library/${libraryItem.libraryId}/item/${libraryItem.id}`
  const bookItem = libraryItem.mediaType === 'book' ? (libraryItem as BookLibraryItem) : null

  if (!isUserAdminOrUp(currentUser.user.type) || !bookItem || !bookItem.media.tracks?.length) {
    redirect(itemPath)
  }

  if (libraryItem.libraryId !== libraryIdFromRoute) {
    const toolQuery = tool ? `?tool=${encodeURIComponent(tool)}` : ''
    redirect(`${itemPath}/tools${toolQuery}`)
  }

  return <AudiobookTools libraryItem={bookItem} />
}
