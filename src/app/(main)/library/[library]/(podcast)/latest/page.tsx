import { getData, getLibraries, getRecentEpisodes } from '@/lib/api'
import { RECENT_EPISODES_PAGE_SIZE } from '@/lib/recentEpisodes'
import { redirect } from 'next/navigation'
import LatestClient from './LatestClient'

export const dynamic = 'force-dynamic'

export default async function LatestPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [librariesResponse, recentEpisodesResponse] = await getData(getLibraries(), getRecentEpisodes(libraryId, RECENT_EPISODES_PAGE_SIZE))

  const library = librariesResponse?.libraries?.find((l) => l.id === libraryId)
  if (library?.mediaType === 'book') {
    redirect(`/library/${libraryId}`)
  }

  const episodes = recentEpisodesResponse?.episodes ?? []

  return (
    <div className="w-full min-w-0 py-8">
      <LatestClient key={libraryId} libraryId={libraryId} initialEpisodes={episodes} />
    </div>
  )
}
