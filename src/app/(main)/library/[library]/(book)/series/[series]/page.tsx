import { getData } from '@/lib/api'
import { getSeriesOrNotFound } from '@/lib/notFound'
import SeriesClient from './SeriesClient'

export default async function SeriesPage({ params }: { params: Promise<{ series: string; library: string }> }) {
  const { series: seriesId, library: libraryId } = await params
  const [series] = await getData(getSeriesOrNotFound(libraryId, seriesId))

  return (
    <div className="h-full w-full">
      <SeriesClient series={series} />
    </div>
  )
}
