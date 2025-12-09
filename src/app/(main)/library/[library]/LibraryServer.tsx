import { getCurrentUser, getData, getLibrary, getLibraryPersonalized } from '../../../../lib/api'
import LibraryClient from './LibraryClient'

export default async function LibraryDataFetcher({ libraryId }: { libraryId: string }) {
  const [library, personalized, currentUser] = await getData(getLibrary(libraryId), getLibraryPersonalized(libraryId), getCurrentUser())

  if (!library) {
    console.error('Error getting library data')
    return null
  }
  if (!personalized) {
    console.error('Error getting personalized data')
    return null
  }

  return <LibraryClient library={library} personalized={personalized} currentUser={currentUser} />
}
