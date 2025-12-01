'use client'

import type { PodcastMedia } from '@/types/api'
import { useMemo } from 'react'
import MediaCard, { type MediaCardProps } from './MediaCard'

export type PodcastMediaCardProps = MediaCardProps

/**
 * Podcast-specific media card with podcast-specific badges.
 */
export default function PodcastMediaCard(props: PodcastMediaCardProps) {
  const { libraryItem } = props
  const media = libraryItem.media as PodcastMedia

  const recentEpisode = useMemo(() => libraryItem.recentEpisode, [libraryItem])

  const recentEpisodeNumber = useMemo(() => {
    if (!recentEpisode) return null
    if (recentEpisode.episode) {
      return recentEpisode.episode.replace(/^#/, '')
    }
    return ''
  }, [recentEpisode])

  const numEpisodes = useMemo(() => media.numEpisodes || 0, [media])
  const numEpisodesIncomplete = useMemo(() => libraryItem.numEpisodesIncomplete || 0, [libraryItem])

  const renderBadges = useMemo(() => {
    const PodcastBadges = ({ isHovering, isSelectionMode, processing }: { isHovering: boolean; isSelectionMode: boolean; processing: boolean }) => {
      // Podcast episode number badge (when showing recent episode)
      if (recentEpisodeNumber !== null && !isHovering && !isSelectionMode && !processing) {
        return (
          <div
            cy-id="podcastEpisodeNumber"
            className="absolute rounded-lg bg-black/90 shadow-modal-content z-10 top-[0.375em] end-[0.375em]"
            style={{ padding: '0.1em 0.25em' }}
          >
            <p style={{ fontSize: '0.8em' }}>
              Episode
              {recentEpisodeNumber && <span>#{recentEpisodeNumber}</span>}
            </p>
          </div>
        )
      }

      // Num episodes incomplete badge (yellow, highest priority)
      if (numEpisodesIncomplete && !isHovering && !isSelectionMode) {
        return (
          <div
            cy-id="numEpisodesIncomplete"
            className="absolute rounded-full bg-yellow-400 text-black font-semibold shadow-modal-content z-10 flex items-center justify-center top-[0.375em] end-[0.375em]"
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
            className="absolute rounded-full bg-black/90 shadow-modal-content z-10 flex items-center justify-center top-[0.375em] end-[0.375em]"
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
  }, [numEpisodes, numEpisodesIncomplete, recentEpisodeNumber])

  return <MediaCard {...props} renderBadges={renderBadges} />
}
