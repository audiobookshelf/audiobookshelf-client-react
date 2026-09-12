import { getData } from '@/lib/api'
import { getLibraryItemOrNotFound } from '@/lib/notFound'
import { namedPageMetadata } from '@/lib/pageMetadata'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import type { Metadata } from 'next'
import LibraryItemClient from './LibraryItemClient'

export async function generateMetadata({ params }: { params: Promise<{ item: string; library: string }> }): Promise<Metadata> {
  const { item: itemId } = await params
  const [libraryItem] = await getData(getLibraryItemOrNotFound(itemId, true, 'downloads,rssfeed,share'))

  return namedPageMetadata(libraryItem.media.metadata.title)
}

export default async function ItemPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId } = await params
  const [libraryItem] = await getData(getLibraryItemOrNotFound(itemId, true, 'downloads,rssfeed,share'))

  return (
    <div className="w-full">
      <LibraryItemClient libraryItem={libraryItem as BookLibraryItem | PodcastLibraryItem} />
    </div>
  )
}
