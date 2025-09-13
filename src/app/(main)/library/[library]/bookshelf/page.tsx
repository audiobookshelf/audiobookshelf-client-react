import { getLibrary, getLibraryItems } from '../../../../../lib/api'
import BookshelfClient from './BookshelfClient'

export default async function BookshelfPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const libraryResponse = await Promise.all([getLibrary(libraryId), getLibraryItems(libraryId)])
  const library = libraryResponse[0].data
  const libraryItemsData = libraryResponse[1].data

  return (
    <div className="p-8 w-full">
      <BookshelfClient library={library} libraryItemsData={libraryItemsData} />
    </div>
  )
}
