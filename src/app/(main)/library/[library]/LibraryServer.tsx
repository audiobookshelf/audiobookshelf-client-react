import { getCurrentUser } from '@/lib/api'
import LibraryClient from './LibraryClient'

export default async function LibraryDataFetcher({ libraryId: _libraryId }: { libraryId: string }) {
  // We no longer need to fetch personalized shelves here as the client fetches them via NavigationContext.
  // const [personalized, currentUser] = await getData(getLibraryPersonalized(libraryId), getCurrentUser())
  // We just need currentUser.
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return null
  }

  return <LibraryClient currentUser={currentUser} />
}
