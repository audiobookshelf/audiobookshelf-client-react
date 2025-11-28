'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { PodcastEpisode } from '@/types/api'
import { useMemo } from 'react'
import MediaCard, { type MediaCardProps } from './MediaCard'

export type PodcastEpisodeCardProps = MediaCardProps

/**
 * Podcast episode card.
 * Displays a specific episode of a podcast.
 */
export default function PodcastEpisodeCard(props: PodcastEpisodeCardProps) {
  const { libraryItem } = props
  const t = useTypeSafeTranslations()

  const recentEpisode = useMemo(() => (libraryItem as { recentEpisode?: PodcastEpisode }).recentEpisode, [libraryItem])

  const recentEpisodeNumber = useMemo(() => {
    if (!recentEpisode) return null
    if (recentEpisode.episode) {
      return recentEpisode.episode.replace(/^#/, '')
    }
    return ''
  }, [recentEpisode])

  const renderBadges = useMemo(() => {
    const EpisodeBadges = ({ isHovering, isSelectionMode }: { isHovering: boolean; isSelectionMode: boolean; processing: boolean }) => {
      // Episode number badge
      if (recentEpisodeNumber !== null && !isHovering && !isSelectionMode) {
        return (
          <div
            cy-id="episodeNumber"
            className="absolute rounded-lg bg-black/90 box-shadow-md z-10 top-[0.375em] end-[0.375em]"
            style={{ padding: `0.1em 0.25em` }}
          >
            <p style={{ fontSize: `${0.8}em` }}>
              {t('LabelEpisode')}
              {recentEpisodeNumber && <span> #{recentEpisodeNumber}</span>}
            </p>
          </div>
        )
      }
      return null
    }
    EpisodeBadges.displayName = 'EpisodeBadges'
    return EpisodeBadges
  }, [recentEpisodeNumber, t])

  return <MediaCard {...props} episode={recentEpisode} renderBadges={renderBadges} />
}
