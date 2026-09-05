import { MAX_PLAYER_QUEUE_ITEMS, buildPodcastEpisodesQueueFromIndex, buildRecentEpisodesQueueFromIndex } from '@/lib/playerQueue'
import type { PodcastEpisode, PodcastLibraryItem, RecentPodcastEpisode } from '@/types/api'

function makeRecentEpisode(index: number): RecentPodcastEpisode {
  return {
    id: `episode-${index}`,
    libraryItemId: 'item-1',
    libraryId: 'lib-1',
    title: `Episode ${index}`,
    audioFile: {},
    podcast: { metadata: { title: 'Pod' }, coverPath: null }
  } as unknown as RecentPodcastEpisode
}

function makePodcastEpisode(index: number): PodcastEpisode {
  return {
    id: `episode-${index}`,
    libraryItemId: 'item-1',
    title: `Episode ${index}`,
    audioFile: {}
  } as unknown as PodcastEpisode
}

const libraryItem = {
  id: 'item-1',
  libraryId: 'lib-1',
  isMissing: false,
  isInvalid: false,
  media: { metadata: { title: 'Pod' }, coverPath: null }
} as unknown as PodcastLibraryItem

describe('buildRecentEpisodesQueueFromIndex', () => {
  it('caps the queue at MAX_PLAYER_QUEUE_ITEMS', () => {
    const episodes = Array.from({ length: 120 }, (_, index) => makeRecentEpisode(index))
    const queue = buildRecentEpisodesQueueFromIndex(episodes, [], 99)

    expect(queue).to.have.length(MAX_PLAYER_QUEUE_ITEMS)
    expect(queue[0].episodeId).to.eq('episode-99')
    expect(queue[queue.length - 1].episodeId).to.eq('episode-0')
  })
})

describe('buildPodcastEpisodesQueueFromIndex', () => {
  it('caps the queue at MAX_PLAYER_QUEUE_ITEMS', () => {
    const episodes = Array.from({ length: 120 }, (_, index) => makePodcastEpisode(index))
    const queue = buildPodcastEpisodesQueueFromIndex(episodes, libraryItem, [], 0)

    expect(queue).to.have.length(MAX_PLAYER_QUEUE_ITEMS)
    expect(queue[0].episodeId).to.eq('episode-0')
    expect(queue[queue.length - 1].episodeId).to.eq('episode-99')
  })
})
