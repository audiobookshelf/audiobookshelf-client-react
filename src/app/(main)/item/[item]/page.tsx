import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { getCurrentUser, getData, getLibrary, getLibraryItem } from '../../../../lib/api'
import LibraryItemClient from './LibraryItemClient'

export default async function ItemPage({ params }: { params: Promise<{ item: string }> }) {
  const { item: itemId } = await params
  const [libraryItem, currentUser] = await getData(getLibraryItem(itemId), getCurrentUser())

  // TODO: Handle loading data error?
  if (!libraryItem || !currentUser) {
    console.error('Error getting library item or user data')
    return null
  }

  const [library] = await getData(getLibrary(libraryItem.libraryId))

  // TODO: Handle loading data error?
  if (!library) {
    console.error('Error getting library data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <LibraryItemClient libraryItem={libraryItem as BookLibraryItem | PodcastLibraryItem} currentUser={currentUser} library={library} />
    </div>
  )
}
