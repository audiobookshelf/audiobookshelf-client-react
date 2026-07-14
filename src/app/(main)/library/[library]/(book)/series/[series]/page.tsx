import { getData, getSeries } from '@/lib/api'
import SeriesClient from './SeriesClient'

export default async function SeriesPage({ params }: { params: Promise<{ series: string; library: string }> }) {
  const { series: seriesId, library: libraryId } = await params
  const [series] = await getData(getSeries(libraryId, seriesId))

  if (!series) {
    console.error('Error getting series data')
    return null
  }

  return (
    <div className="h-full w-full">
      <SeriesClient series={series} />
    </div>
  )
}
