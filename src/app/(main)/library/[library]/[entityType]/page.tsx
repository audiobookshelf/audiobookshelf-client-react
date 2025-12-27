import { getCurrentUser, getData, getLibrary } from '@/lib/api'
import { EntityType } from '@/types/api'
import { notFound } from 'next/navigation'
import BookshelfClient from './BookshelfClient'

export default async function EntityPage({ params }: { params: Promise<{ library: string; entityType: string }> }) {
  const { library: libraryId, entityType: entityTypeString } = await params
  const entityType = entityTypeString as EntityType

  // 1. Fetch data to check media type
  const [library, currentUser] = await getData(getLibrary(libraryId), getCurrentUser())

  if (!library) {
    notFound()
  }

  // 2. Define valid entities
  const validEntities: EntityType[] = library.mediaType === 'podcast' ? ['items', 'playlists'] : ['items', 'collections', 'playlists', 'authors', 'series']
  if (!validEntities.includes(entityType)) {
    notFound()
  }

  return (
    <div className="w-full h-full">
      <BookshelfClient library={library} entityType={entityType} currentUser={currentUser} />
    </div>
  )
}
