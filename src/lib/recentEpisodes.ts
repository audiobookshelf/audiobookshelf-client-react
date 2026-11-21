import type { GroupCoverItem } from '@/lib/coverUtils'
import type { RecentPodcastEpisode } from '@/types/api'

export const RECENT_EPISODES_PAGE_SIZE = 50

/** Append episodes in source order while ignoring duplicates from offset pagination. */
export function appendUniqueRecentEpisodes(current: RecentPodcastEpisode[], incoming: RecentPodcastEpisode[]): RecentPodcastEpisode[] {
  if (!incoming.length) return current

  const seen = new Set(current.map((episode) => episode.id))
  const uniqueIncoming = incoming.filter((episode) => {
    if (seen.has(episode.id)) return false
    seen.add(episode.id)
    return true
  })

  return uniqueIncoming.length ? [...current, ...uniqueIncoming] : current
}

/** Build distinct covers for recent episodes in feed order. */
export function getUniqueEpisodeCovers(episodes: RecentPodcastEpisode[]): GroupCoverItem[] {
  const seen = new Set<string>()
  const items: GroupCoverItem[] = []

  for (const episode of episodes) {
    const coverKey = episode.coverPath || episode.libraryItemId
    if (seen.has(coverKey)) continue
    seen.add(coverKey)

    items.push({
      libraryItem: {
        id: episode.libraryItemId,
        media: episode.podcast
      },
      episode
    })

    if (items.length >= 4) break
  }

  return items
}
