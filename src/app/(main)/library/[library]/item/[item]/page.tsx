import { getData } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { getLibraryItemOrNotFound } from '@/lib/notFound'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import type { Metadata } from 'next'
import LibraryItemClient from './LibraryItemClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleAudiobookshelfLibraryItems')
  }
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
