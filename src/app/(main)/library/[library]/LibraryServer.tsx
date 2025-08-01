import { getLibrary, getLibraryPersonalized } from '../../../../lib/api'
import LibraryClient from './LibraryClient'

export default async function LibraryDataFetcher({ libraryId }: { libraryId: string }) {
  const libraryResponse = await Promise.all([getLibrary(libraryId), getLibraryPersonalized(libraryId)])
  const library = libraryResponse[0].data
  const personalized = libraryResponse[1].data

  return <LibraryClient library={library} personalized={personalized} />
}
