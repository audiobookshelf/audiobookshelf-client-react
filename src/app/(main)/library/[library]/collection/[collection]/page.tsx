import { getData } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { getCollectionOrNotFound } from '@/lib/notFound'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import CollectionClient from './CollectionClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleAudiobookshelfCollections')
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ collection: string; library: string }> }) {
  const { collection: collectionId, library: libraryIdFromRoute } = await params
  const [collection] = await getData(getCollectionOrNotFound(collectionId))

  if (collection.libraryId !== libraryIdFromRoute) {
    redirect(`/library/${collection.libraryId}/collection/${collectionId}`)
  }

  return (
    <div className="w-full min-w-0 py-8">
      <CollectionClient collection={collection} />
    </div>
  )
}
