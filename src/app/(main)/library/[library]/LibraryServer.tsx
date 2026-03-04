import { getData, getLibraryPersonalized } from '../../../../lib/api'
import LibraryClient from './LibraryClient'

export default async function LibraryDataFetcher({ libraryId }: { libraryId: string }) {
  const [personalized] = await getData(getLibraryPersonalized(libraryId))

  if (!personalized) {
    console.error('Error getting personalized data')
    return null
  }

  return <LibraryClient personalized={personalized} />
}
