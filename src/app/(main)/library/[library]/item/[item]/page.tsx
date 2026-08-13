import { getData } from '@/lib/api'
import { getLibraryItemOrNotFound } from '@/lib/notFound'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import LibraryItemClient from './LibraryItemClient'

export default async function ItemPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId } = await params
  const [libraryItem] = await getData(getLibraryItemOrNotFound(itemId, true, 'downloads,rssfeed,share'))

  return (
    <div className="w-full">
      <LibraryItemClient libraryItem={libraryItem as BookLibraryItem | PodcastLibraryItem} />
    </div>
  )
}
