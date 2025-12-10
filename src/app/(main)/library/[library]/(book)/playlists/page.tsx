import { getCurrentUser, getData, getLibrary, getPlaylistsList } from '@/lib/api'
import PlaylistsClient from './PlaylistsClient'

export default async function PlaylistsPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [playlistsData, currentUser, library] = await getData(getPlaylistsList(libraryId), getCurrentUser(), getLibrary(libraryId))

  if (!playlistsData || !currentUser || !library) {
    console.error('Error getting playlists data or user or library data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <PlaylistsClient playlistsData={playlistsData} library={library} currentUser={currentUser} />
    </div>
  )
}
