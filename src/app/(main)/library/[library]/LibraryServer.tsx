import { getData, getLibrary, getLibraryPersonalized } from '../../../../lib/api'
import LibraryClient from './LibraryClient'

export default async function LibraryDataFetcher({ libraryId }: { libraryId: string }) {
  const [library, personalized] = await getData(getLibrary(libraryId), getLibraryPersonalized(libraryId))

  if (!library) {
    console.error('Error getting library data')
    return null
  }
  if (!personalized) {
    console.error('Error getting personalized data')
    return null
  }

  return <LibraryClient library={library} personalized={personalized} />
}
