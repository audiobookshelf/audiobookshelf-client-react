import { getData, getEpisodeDownloadQueue, getLibraries } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import DownloadQueueClient from './DownloadQueueClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleAudiobookshelfPodcastQueue')
  }
}

export default async function DownloadQueuePage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [librariesResponse, queueResponse] = await getData(getLibraries(), getEpisodeDownloadQueue(libraryId))

  const library = librariesResponse?.libraries?.find((l) => l.id === libraryId)
  if (library?.mediaType === 'book') {
    redirect(`/library/${libraryId}`)
  }

  const initialQueue = queueResponse?.queue ?? []
  const initialCurrentDownload = queueResponse?.currentDownload

  return (
    <div className="w-full min-w-0 py-6 sm:px-4 md:p-12">
      <DownloadQueueClient initialQueue={initialQueue} initialCurrentDownload={initialCurrentDownload} />
    </div>
  )
}
