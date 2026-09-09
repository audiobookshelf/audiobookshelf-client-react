import { getData, getLibraryStats } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import type { Metadata } from 'next'
import StatsClient from './StatsClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleAudiobookshelfStats')
  }
}

export default async function StatsPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [libraryStats] = await getData(getLibraryStats(libraryId))

  if (!libraryStats) {
    console.error('Error getting library stats')
    return null
  }

  return (
    <div className="w-full p-8">
      <StatsClient stats={libraryStats} />
    </div>
  )
}
