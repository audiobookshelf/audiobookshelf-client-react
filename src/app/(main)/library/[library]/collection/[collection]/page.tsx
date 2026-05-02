import { getCollection, getCurrentUser, getData } from '@/lib/api'
import { redirect } from 'next/navigation'
import CollectionClient from './CollectionClient'

export default async function CollectionPage({ params }: { params: Promise<{ collection: string; library: string }> }) {
  const { collection: collectionId, library: libraryIdFromRoute } = await params
  const [collection, currentUser] = await getData(getCollection(collectionId), getCurrentUser())

  if (!collection || !currentUser) {
    console.error('Error getting collection or user data')
    return null
  }

  if (collection.libraryId !== libraryIdFromRoute) {
    redirect(`/library/${collection.libraryId}/collection/${collectionId}`)
  }

  return (
    <div className="w-full min-w-0 px-2 py-8">
      <CollectionClient collection={collection} />
    </div>
  )
}
