import { getCurrentUser, getData, getSeries } from '@/lib/api'
import SeriesClient from './SeriesClient'

export default async function SeriesPage({ params }: { params: Promise<{ series: string; library: string }> }) {
  const { series: seriesId, library: libraryId } = await params
  const [series, currentUser] = await getData(getSeries(libraryId, seriesId), getCurrentUser())

  if (!series || !currentUser) {
    console.error('Error getting series or user data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <SeriesClient currentUser={currentUser} seriesId={seriesId} />
    </div>
  )
}
