import { getCurrentUser, getData, getLibraryItems, getSeries } from '@/lib/api'
import SeriesClient from './SeriesClient'

export default async function SeriesPage({ params }: { params: Promise<{ series: string; library: string }> }) {
  const { series: seriesId, library: libraryId } = await params
  const [series, currentUser, libraryItems] = await getData(
    getSeries(libraryId, seriesId),
    getCurrentUser(),
    getLibraryItems(libraryId, `filter=series.${encodeURIComponent(Buffer.from(seriesId).toString('base64'))}`)
  )

  if (!series || !currentUser || !libraryItems) {
    console.error('Error getting series or user or library items data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <SeriesClient currentUser={currentUser} libraryItems={libraryItems} />
    </div>
  )
}
