import { getCollection, getCurrentUser, getData, getLibrary } from '@/lib/api'
import CollectionClient from './CollectionClient'

export default async function CollectionPage({ params }: { params: Promise<{ collection: string; library: string }> }) {
  const { collection: collectionId, library: libraryId } = await params
  const [collection, currentUser, library] = await getData(getCollection(collectionId), getCurrentUser(), getLibrary(libraryId))

  if (!collection || !currentUser || !library) {
    console.error('Error getting collection or user or library data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <CollectionClient collection={collection} library={library} />
    </div>
  )
}
