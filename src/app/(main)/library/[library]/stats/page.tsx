import { getLibraryStats } from '@/lib/api'
import StatsClient from './StatsClient'

export default async function StatsPage({ params }: { params: { library: string } }) {
  const libraryId = params.library
  const libraryStats = await getLibraryStats(libraryId)
  return (
    <div className="w-full p-8">
      <StatsClient stats={libraryStats} />
    </div>
  )
}
