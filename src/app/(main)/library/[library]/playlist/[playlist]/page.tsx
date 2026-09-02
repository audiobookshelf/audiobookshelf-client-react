import { getData } from '@/lib/api'
import { getPlaylistOrNotFound } from '@/lib/notFound'
import { redirect } from 'next/navigation'
import PlaylistClient from './PlaylistClient'

export default async function PlaylistPage({ params }: { params: Promise<{ playlist: string; library: string }> }) {
  const { playlist: playlistId, library: libraryIdFromRoute } = await params
  const [playlist] = await getData(getPlaylistOrNotFound(playlistId))

  if (playlist.libraryId !== libraryIdFromRoute) {
    redirect(`/library/${playlist.libraryId}/playlist/${playlistId}`)
  }

  return (
    <div className="w-full min-w-0 py-8">
      <PlaylistClient playlist={playlist} />
    </div>
  )
}
