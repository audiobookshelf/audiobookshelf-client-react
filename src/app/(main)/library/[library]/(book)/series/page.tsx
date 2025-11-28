import { getData, getSeriesList } from '@/lib/api'
import SeriesClient from './SeriesClient'

export default async function SeriesPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [seriesData] = await getData(getSeriesList(libraryId))

  return (
    <div className="p-8 w-full">
      <SeriesClient seriesData={seriesData} />
    </div>
  )
}
