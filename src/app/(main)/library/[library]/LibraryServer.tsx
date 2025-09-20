import { getLibrary, getLibraryPersonalized, getData } from '../../../../lib/api'
import LibraryClient from './LibraryClient'

export default async function LibraryDataFetcher({ libraryId }: { libraryId: string }) {
  const [libraryResponse, personalizedResponse] = await getData(getLibrary(libraryId), getLibraryPersonalized(libraryId))

  if (libraryResponse.error || !libraryResponse.data) {
    console.error('Error getting library data:', libraryResponse)
    return null
  }
  if (personalizedResponse.error || !personalizedResponse.data) {
    console.error('Error getting personalized data:', personalizedResponse)
    return null
  }

  const library = libraryResponse.data
  const personalized = personalizedResponse.data

  return <LibraryClient library={library} personalized={personalized} />
}
