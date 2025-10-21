import { getData, getLibrary, getLibraryItems } from '../../../../../lib/api'
import BookshelfClient from './BookshelfClient'

export default async function BookshelfPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [library, libraryItems] = await getData(getLibrary(libraryId), getLibraryItems(libraryId))

  return (
    <div className="p-8 w-full">
      <BookshelfClient library={library} libraryItemsData={libraryItems} />
    </div>
  )
}
