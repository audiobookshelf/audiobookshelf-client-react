import { getCurrentUser, getData, getLibrary, getSeries } from '@/lib/api'
import SeriesClient from './SeriesClient'

export default async function SeriesPage({ params }: { params: Promise<{ series: string; library: string }> }) {
  const { series: seriesId, library: libraryId } = await params
  const [series, currentUser, library] = await getData(getSeries(libraryId, seriesId), getCurrentUser(), getLibrary(libraryId))

  if (!series || !currentUser || !library) {
    console.error('Error getting series or user or library data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <SeriesClient series={series} currentUser={currentUser} library={library} />
    </div>
  )
}
