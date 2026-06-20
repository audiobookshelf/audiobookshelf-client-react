'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { PodcastMedia } from '@/types/api'
import { useMemo } from 'react'
import MediaCard, { type MediaCardProps } from './MediaCard'

export type PodcastMediaCardProps = MediaCardProps

/**
 * Podcast-specific media card with podcast-specific badges.
 */
export default function PodcastMediaCard(props: PodcastMediaCardProps) {
  const { libraryItem, episode } = props
  const t = useTypeSafeTranslations()
  const media = libraryItem.media as PodcastMedia

  const recentEpisode = useMemo(() => libraryItem.recentEpisode, [libraryItem])
  const badgeEpisode = episode ?? recentEpisode

  const episodeNumber = useMemo(() => {
    if (!badgeEpisode) return null
    if (badgeEpisode.episode) {
      return badgeEpisode.episode.replace(/^#/, '')
    }
    return ''
  }, [badgeEpisode])

  const numEpisodes = useMemo(() => media.numEpisodes || 0, [media])
  const numEpisodesIncomplete = useMemo(() => libraryItem.numEpisodesIncomplete || 0, [libraryItem])

  const renderBadges = useMemo(() => {
    const PodcastBadges = ({ isHovering, isSelectionMode, processing }: { isHovering: boolean; isSelectionMode: boolean; processing: boolean }) => {
      const isEpisodeCard = !!episode || !!recentEpisode

      // Episode number badge (specific episode entry or recent episode on home shelf)
      if (isEpisodeCard && episodeNumber !== null && !isHovering && !isSelectionMode && (!processing || !!episode)) {
        return (
          <div
            cy-id={episode ? 'episodeNumber' : 'podcastEpisodeNumber'}
            className="shadow-modal-content absolute end-[0.375em] top-[0.375em] z-10 rounded-lg bg-black/90 text-white"
            style={{ padding: '0.1em 0.25em' }}
          >
            <p style={{ fontSize: '0.8em' }}>
              {t('LabelEpisode')}
              {episodeNumber && <span> #{episodeNumber}</span>}
            </p>
          </div>
        )
      }

      if (episode) return null

      // Num episodes incomplete badge (yellow, highest priority)
      if (numEpisodesIncomplete && !isHovering && !isSelectionMode) {
        return (
          <div
            cy-id="numEpisodesIncomplete"
            className="shadow-modal-content absolute end-[0.375em] top-[0.375em] z-10 flex items-center justify-center rounded-full bg-yellow-400 font-semibold text-black"
            style={{ width: '1.25em', height: '1.25em' }}
          >
            <p style={{ fontSize: '0.8em' }} role="status" aria-label="Number of episodes">
              {numEpisodesIncomplete}
            </p>
          </div>
        )
      }

      // Num episodes badge (regular)
      if (!numEpisodesIncomplete && numEpisodes && !isHovering && !isSelectionMode) {
        return (
          <div
            cy-id="numEpisodes"
            className="shadow-modal-content absolute end-[0.375em] top-[0.375em] z-10 flex items-center justify-center rounded-full bg-black/90 text-white"
            style={{ width: '1.25em', height: '1.25em' }}
          >
            <p style={{ fontSize: '0.8em' }} role="status" aria-label="Number of episodes">
              {numEpisodes}
            </p>
          </div>
        )
      }

      return null
    }
    PodcastBadges.displayName = 'PodcastBadges'
    return PodcastBadges
  }, [episode, episodeNumber, numEpisodes, numEpisodesIncomplete, recentEpisode, t])

  return <MediaCard {...props} renderBadges={renderBadges} />
}
