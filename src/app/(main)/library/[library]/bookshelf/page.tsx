import { getCurrentUser, getData, getLibrary, getLibraryItems } from '../../../../../lib/api'
import BookshelfClient from './BookshelfClient'

export default async function BookshelfPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [library, libraryItems, currentUser] = await getData(getLibrary(libraryId), getLibraryItems(libraryId, 'limit=100'), getCurrentUser())

  return (
    <div className="p-8 w-full">
      <BookshelfClient library={library} libraryItemsData={libraryItems} currentUser={currentUser} />
    </div>
  )
}
