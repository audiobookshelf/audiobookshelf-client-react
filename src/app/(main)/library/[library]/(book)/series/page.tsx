import { getCurrentUser, getData, getLibrary, getSeriesList } from '@/lib/api'
import SeriesClient from './SeriesClient'

export default async function SeriesPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [seriesData, currentUser, library] = await getData(getSeriesList(libraryId), getCurrentUser(), getLibrary(libraryId))

  return (
    <div className="p-8 w-full">
      <SeriesClient seriesData={seriesData} library={library} currentUser={currentUser} />
    </div>
  )
}
