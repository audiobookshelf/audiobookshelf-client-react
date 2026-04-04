import { getData, getLibraryItem } from '@/lib/api'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import LibraryItemClient from './LibraryItemClient'

export default async function ItemPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId } = await params
  const [libraryItem] = await getData(getLibraryItem(itemId, true, 'rssfeed,share'))

  // TODO: Handle loading data error?
  if (!libraryItem) {
    console.error('Error getting library item')
    return null
  }

  return (
    <div className="w-full p-6 sm:p-8">
      <LibraryItemClient libraryItem={libraryItem as BookLibraryItem | PodcastLibraryItem} />
    </div>
  )
}
