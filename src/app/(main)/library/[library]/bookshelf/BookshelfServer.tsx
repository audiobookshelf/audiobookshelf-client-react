import { getLibrary, getLibraryItems } from '../../../../../lib/api'
import BookshelfClient from './BookshelfClient'

export default async function BookshelfServer({ libraryId }: { libraryId: string }) {
  const libraryResponse = await Promise.all([getLibrary(libraryId), getLibraryItems(libraryId)])
  const library = libraryResponse[0].data
  const libraryItemsData = libraryResponse[1].data

  return <BookshelfClient library={library} libraryItemsData={libraryItemsData} />
}
