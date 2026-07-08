'use client'

import CurrentDownloadRow from '@/components/widgets/CurrentDownloadRow'
import PodcastDownloadQueueTable from '@/components/widgets/PodcastDownloadQueueTable'
import { useLibraryDownloadQueueSocket } from '@/hooks/useLibraryDownloadQueueSocket'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { PodcastEpisodeDownload } from '@/types/api'

interface DownloadQueueClientProps {
  initialQueue: PodcastEpisodeDownload[]
  initialCurrentDownload?: PodcastEpisodeDownload
}

export default function DownloadQueueClient({ initialQueue, initialCurrentDownload }: DownloadQueueClientProps) {
  const t = useTypeSafeTranslations()
  const { episodesDownloading, episodeDownloadsQueued } = useLibraryDownloadQueueSocket({
    initialQueue,
    initialCurrentDownload
  })

  return (
    <div className="mx-auto max-w-5xl px-6 py-4">
      <p className="mb-2 text-xl font-semibold md:px-0">{t('HeaderCurrentDownloads')}</p>
      {!episodesDownloading.length && <p className="py-4 text-lg md:px-0">{t('MessageNoDownloadsInProgress')}</p>}
      {episodesDownloading.map((episode) => (
        <CurrentDownloadRow key={episode.id} episode={episode} />
      ))}

      {episodeDownloadsQueued.length > 0 && <PodcastDownloadQueueTable queue={episodeDownloadsQueued} />}
    </div>
  )
}
