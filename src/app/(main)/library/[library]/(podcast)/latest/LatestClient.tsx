'use client'

import SquareGridGroupCover from '@/components/widgets/media-card/SquareGridGroupCover'
import RecentEpisodeRow, { RecentEpisodeRowDivider } from '@/components/widgets/RecentEpisodeRow'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getUniqueCoverLibraryItems } from '@/lib/recentEpisodes'
import type { RecentPodcastEpisode } from '@/types/api'
import { useMemo } from 'react'

interface LatestClientProps {
  episodes: RecentPodcastEpisode[]
}

export default function LatestClient({ episodes }: LatestClientProps) {
  const t = useTypeSafeTranslations()
  const coverAspectRatio = useBookCoverAspectRatio()

  const coverWidth = 120
  const coverHeight = coverWidth / coverAspectRatio

  const coverItems = useMemo(() => getUniqueCoverLibraryItems(episodes), [episodes])

  const episodeList = (
    <div className="min-w-0 px-2 py-2 md:px-0">
      {!episodes.length && <p className="text-foreground text-center text-xl">{t('MessageNoEpisodes')}</p>}
      {episodes.map((episode, index) => (
        <div key={episode.id}>
          <RecentEpisodeRow episode={episode} episodeIndex={index} episodes={episodes} />
          {index < episodes.length - 1 && <RecentEpisodeRowDivider />}
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 md:flex-row md:items-start md:gap-10">
        {coverItems.length > 0 && <SquareGridGroupCover libraryItems={coverItems} width={coverWidth * 2} height={coverHeight * 2} emptyLabel="" />}
        <div className="flex w-full min-w-0 flex-1 flex-col gap-2">
          <h1 className="text-foreground min-w-0 px-2 text-2xl font-bold break-words md:px-0">{t('HeaderLatestEpisodes')}</h1>
          {episodeList}
        </div>
      </div>
    </div>
  )
}
