import { getShelfEntityEpisode, getShelfEntityNavigationId, type ShelfNavigationEntity } from '@/lib/shelfNavigationEntity'

export type EpisodeNavigationSlot = {
  episodeId: string
  libraryItemId: string
}

export type EpisodeNavigationContext = {
  slots: EpisodeNavigationSlot[]
  initialIndex: number
}

/**
 * Prev/next episode scope for one shelf slot: contiguous non-null run around `entityIndex`,
 * filtered to episode-only entities within that run.
 */
function getShelfEpisodeNavigationContext(entities: (ShelfNavigationEntity | null)[], entityIndex: number): EpisodeNavigationContext | null {
  if (entityIndex < 0 || entityIndex >= entities.length) return null

  const at = entities[entityIndex]
  if (at === null) return null

  const atEpisode = getShelfEntityEpisode(at)
  if (!atEpisode?.id) return null

  let start = entityIndex
  while (start > 0 && entities[start - 1] !== null) {
    start--
  }

  let end = entityIndex
  while (end < entities.length - 1 && entities[end + 1] !== null) {
    end++
  }

  const slots: EpisodeNavigationSlot[] = []
  let initialIndex = -1

  for (let j = start; j <= end; j++) {
    const entity = entities[j]
    if (entity === null) continue
    const episode = getShelfEntityEpisode(entity)
    if (!episode?.id) continue
    if (j === entityIndex) {
      initialIndex = slots.length
    }
    slots.push({
      episodeId: episode.id,
      libraryItemId: getShelfEntityNavigationId(entity)
    })
  }

  if (initialIndex < 0 || slots.length === 0) return null

  return { slots, initialIndex }
}

const defaultSingleEpisodeNavCtx = (episodeId: string, libraryItemId: string): EpisodeNavigationContext => ({
  slots: [{ episodeId, libraryItemId }],
  initialIndex: 0
})

export function getMediaCardEpisodeEditNavigationContext(
  episodeId: string,
  libraryItemId: string,
  shelfEntities?: (ShelfNavigationEntity | null)[],
  entityIndex?: number
): EpisodeNavigationContext {
  if (shelfEntities !== undefined && entityIndex !== undefined) {
    const computed = getShelfEpisodeNavigationContext(shelfEntities, entityIndex)
    if (computed) return computed
  }
  return defaultSingleEpisodeNavCtx(episodeId, libraryItemId)
}

export function getPodcastEpisodeNavigationContext(libraryItemId: string, episodes: { id: string }[], episodeId: string): EpisodeNavigationContext | null {
  const slots = episodes.map((episode) => ({ episodeId: episode.id, libraryItemId }))
  const initialIndex = slots.findIndex((slot) => slot.episodeId === episodeId)
  if (initialIndex < 0) return null
  return { slots, initialIndex }
}
