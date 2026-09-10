import { getData } from '@/lib/api'
import { getCollectionOrNotFound } from '@/lib/notFound'
import { namedPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import CollectionClient from './CollectionClient'

export async function generateMetadata({ params }: { params: Promise<{ collection: string; library: string }> }): Promise<Metadata> {
  const { collection: collectionId } = await params
  const [collection] = await getData(getCollectionOrNotFound(collectionId))

  return namedPageMetadata(collection.name)
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
