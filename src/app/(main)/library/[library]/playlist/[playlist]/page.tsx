import { getData } from '@/lib/api'
import { getPlaylistOrNotFound } from '@/lib/notFound'
import { namedPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import PlaylistClient from './PlaylistClient'

export async function generateMetadata({ params }: { params: Promise<{ playlist: string; library: string }> }): Promise<Metadata> {
  const { playlist: playlistId } = await params
  const [playlist] = await getData(getPlaylistOrNotFound(playlistId))

  return namedPageMetadata(playlist.name)
}

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
