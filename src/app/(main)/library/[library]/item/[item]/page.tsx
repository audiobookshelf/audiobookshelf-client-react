import { getCurrentUser, getData, getLibraryItem } from '@/lib/api'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import LibraryItemClient from './LibraryItemClient'

export default async function ItemPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId } = await params
  const [libraryItem, currentUser] = await getData(getLibraryItem(itemId, true), getCurrentUser())

  // TODO: Handle loading data error?
  if (!libraryItem || !currentUser) {
    console.error('Error getting library item or user data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <LibraryItemClient libraryItem={libraryItem as BookLibraryItem | PodcastLibraryItem} currentUser={currentUser} />
    </div>
  )
}
