import type { EntityNavigationContext } from '@/lib/bookshelfNavigationContext'
import type { PlaylistItem } from '@/types/api'

export function getPlaylistEpisodeNavigationContext(orderedItems: PlaylistItem[], episodeId: string): EntityNavigationContext | null {
  const episodeIds = orderedItems.flatMap((item) => (item.episode ? [item.episode.id] : []))
  const initialIndex = episodeIds.indexOf(episodeId)
  if (initialIndex < 0) return null
  return { entityIds: episodeIds, initialIndex }
}

export function getPodcastEpisodeNavigationContext(episodes: { id: string }[], episodeId: string): EntityNavigationContext | null {
  const episodeIds = episodes.map((episode) => episode.id)
  const initialIndex = episodeIds.indexOf(episodeId)
  if (initialIndex < 0) return null
  return { entityIds: episodeIds, initialIndex }
}
