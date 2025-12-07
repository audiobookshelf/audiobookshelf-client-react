import { getCollectionsList, getCurrentUser, getData, getLibrary } from '@/lib/api'
import CollectionsClient from './CollectionsClient'

export default async function CollectionsPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [collectionsData, currentUser, library] = await getData(getCollectionsList(libraryId), getCurrentUser(), getLibrary(libraryId))

  if (!collectionsData || !currentUser || !library) {
    console.error('Error getting collections data or user or library data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <CollectionsClient collectionsData={collectionsData} library={library} currentUser={currentUser} />
    </div>
  )
}
