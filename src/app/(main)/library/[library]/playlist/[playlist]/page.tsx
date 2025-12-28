import { getCurrentUser, getData, getPlaylist } from '@/lib/api'
import PlaylistClient from './PlaylistClient'

export default async function PlaylistPage({ params }: { params: Promise<{ playlist: string; library: string }> }) {
  const { playlist: playlistId } = await params
  const [playlist, currentUser] = await getData(getPlaylist(playlistId), getCurrentUser())

  if (!playlist || !currentUser) {
    console.error('Error getting playlist or user data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <PlaylistClient playlist={playlist} />
    </div>
  )
}
