import { getCurrentUser, getData, getLibrary, getPlaylist } from '@/lib/api'
import PlaylistClient from './PlaylistClient'

export default async function PlaylistPage({ params }: { params: Promise<{ playlist: string; library: string }> }) {
  const { playlist: playlistId, library: libraryId } = await params
  const [playlist, currentUser, library] = await getData(getPlaylist(playlistId), getCurrentUser(), getLibrary(libraryId))

  if (!playlist || !currentUser || !library) {
    console.error('Error getting playlist or user or library data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <PlaylistClient playlist={playlist} library={library} />
    </div>
  )
}
