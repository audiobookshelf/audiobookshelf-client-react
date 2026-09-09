import { getData } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { getSeriesOrNotFound } from '@/lib/notFound'
import type { Metadata } from 'next'
import SeriesClient from './SeriesClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleAudiobookshelfSeries')
  }
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
