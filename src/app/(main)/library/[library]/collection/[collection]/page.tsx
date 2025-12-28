import { getCollection, getCurrentUser, getData } from '@/lib/api'
import CollectionClient from './CollectionClient'

export default async function CollectionPage({ params }: { params: Promise<{ collection: string; library: string }> }) {
  const { collection: collectionId } = await params
  const [collection, currentUser] = await getData(getCollection(collectionId), getCurrentUser())

  if (!collection || !currentUser) {
    console.error('Error getting collection or user data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <CollectionClient collection={collection} />
    </div>
  )
}
