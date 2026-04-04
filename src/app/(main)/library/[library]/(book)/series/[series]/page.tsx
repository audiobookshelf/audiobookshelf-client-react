import { getData, getLibraryItems, getSeries } from '@/lib/api'
import SeriesClient from './SeriesClient'

export default async function SeriesPage({ params }: { params: Promise<{ series: string; library: string }> }) {
  const { series: seriesId, library: libraryId } = await params
  const [series, libraryItems] = await getData(
    getSeries(libraryId, seriesId),
    getLibraryItems(libraryId, `filter=series.${encodeURIComponent(Buffer.from(seriesId).toString('base64'))}`)
  )

  if (!series || !libraryItems) {
    console.error('Error getting series or library items data')
    return null
  }

  return (
    <div className="w-full p-8">
      <SeriesClient libraryItems={libraryItems} />
    </div>
  )
}
