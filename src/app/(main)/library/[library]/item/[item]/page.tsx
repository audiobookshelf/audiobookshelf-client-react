import { getCurrentUser, getData, getLibrary, getLibraryItem } from '@/lib/api'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import LibraryItemClient from './LibraryItemClient'

export default async function ItemPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId, library: libraryId } = await params
  const [libraryItem, currentUser, library] = await getData(getLibraryItem(itemId, true), getCurrentUser(), getLibrary(libraryId))

  // TODO: Handle loading data error?
  if (!libraryItem || !currentUser || !library) {
    console.error('Error getting library item or user or library data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <LibraryItemClient libraryItem={libraryItem as BookLibraryItem | PodcastLibraryItem} currentUser={currentUser} library={library} />
    </div>
  )
}
