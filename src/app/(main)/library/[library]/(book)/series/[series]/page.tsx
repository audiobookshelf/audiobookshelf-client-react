import { getData } from '@/lib/api'
import { getSeriesOrNotFound } from '@/lib/notFound'
import { namedPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import SeriesClient from './SeriesClient'

export async function generateMetadata({ params }: { params: Promise<{ series: string; library: string }> }): Promise<Metadata> {
  const { series: seriesId, library: libraryId } = await params
  const [series] = await getData(getSeriesOrNotFound(libraryId, seriesId))

  return namedPageMetadata(series.name)
}

export default async function SeriesPage({ params }: { params: Promise<{ series: string; library: string }> }) {
  const { series: seriesId, library: libraryId } = await params
  const [series] = await getData(getSeriesOrNotFound(libraryId, seriesId))

  return (
    <div className="h-full w-full">
      <SeriesClient series={series} />
    </div>
  )
}
