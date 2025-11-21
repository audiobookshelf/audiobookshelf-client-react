'use client'

import type { LibraryItem, PodcastEpisode } from '@/types/api'
import { useMemo } from 'react'
import LazyLibraryItemCard, { type LazyLibraryItemCardProps } from './LazyLibraryItemCard'

export type PodcastMediaCardProps = LazyLibraryItemCardProps

/**
 * Podcast-specific media card with podcast-specific badges.
 */
export default function PodcastMediaCard(props: PodcastMediaCardProps) {
  const { libraryItem } = props
  const media = libraryItem.media as LibraryItem['media']

  const recentEpisode = useMemo(() => (libraryItem as { recentEpisode?: PodcastEpisode }).recentEpisode, [libraryItem])

  const recentEpisodeNumber = useMemo(() => {
    if (!recentEpisode) return null
    if (recentEpisode.episode) {
      return recentEpisode.episode.replace(/^#/, '')
    }
    return ''
  }, [recentEpisode])

  const numEpisodes = useMemo(() => (media as { numEpisodes?: number }).numEpisodes || 0, [media])
  const numEpisodesIncomplete = useMemo(() => (libraryItem as { numEpisodesIncomplete?: number }).numEpisodesIncomplete || 0, [libraryItem])

  const renderBadges = useMemo(() => {
    const PodcastBadges = ({ isHovering, isSelectionMode, processing }: { isHovering: boolean; isSelectionMode: boolean; processing: boolean }) => {
      // Podcast episode number badge (when showing recent episode)
      if (recentEpisodeNumber !== null && !isHovering && !isSelectionMode && !processing) {
        return (
          <div
            cy-id="podcastEpisodeNumber"
            className="absolute rounded-lg bg-black/90 box-shadow-md z-10 top-[0.375em] end-[0.375em]"
            style={{ padding: `0.1em 0.25em` }}
          >
            <p style={{ fontSize: `${0.8}em` }}>
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
            className="absolute rounded-full bg-yellow-400 text-black font-semibold box-shadow-md z-10 flex items-center justify-center top-[0.375em] end-[0.375em]"
            style={{ width: `${1.25}em`, height: `${1.25}em` }}
          >
            <p style={{ fontSize: `${0.8}em` }} role="status" aria-label="Number of episodes">
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
            className="absolute rounded-full bg-black/90 box-shadow-md z-10 flex items-center justify-center top-[0.375em] end-[0.375em]"
            style={{ width: `${1.25}em`, height: `${1.25}em` }}
          >
            <p style={{ fontSize: `${0.8}em` }} role="status" aria-label="Number of episodes">
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

  return <LazyLibraryItemCard {...props} renderBadges={renderBadges} />
}
