import { getCurrentUser, getData, getLibraryPersonalized } from '../../../../lib/api'
import LibraryClient from './LibraryClient'

export default async function LibraryDataFetcher({ libraryId }: { libraryId: string }) {
  const [personalized, currentUser] = await getData(getLibraryPersonalized(libraryId), getCurrentUser())

  if (!personalized) {
    console.error('Error getting personalized data')
    return null
  }

  return <LibraryClient personalized={personalized} currentUser={currentUser} />
}
