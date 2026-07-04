import { getData, getLibraries, getRecentEpisodes } from '@/lib/api'
import { redirect } from 'next/navigation'
import LatestClient from './LatestClient'

export const dynamic = 'force-dynamic'

export default async function LatestPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [librariesResponse, recentEpisodesResponse] = await getData(getLibraries(), getRecentEpisodes(libraryId))

  const library = librariesResponse?.libraries?.find((l) => l.id === libraryId)
  if (library?.mediaType === 'book') {
    redirect(`/library/${libraryId}`)
  }

  const episodes = recentEpisodesResponse?.episodes ?? []

  return (
    <div className="w-full min-w-0 py-8">
      <LatestClient episodes={episodes} />
    </div>
  )
}
