import { mergeLibraryItemUpdate } from '@/lib/libraryItemUpdatedUtils'
import type { BookLibraryItem, LibraryItem, MediaItemShare, PodcastEpisode, PodcastLibraryItem, RssFeed } from '@/types/api'

const rssFeed = { id: 'feed-1', entityId: 'pod-1' } as RssFeed
const mediaItemShare = { id: 'share-1', mediaItemId: 'media-1' } as MediaItemShare
const recentEpisode = { id: 'ep-kept' } as PodcastEpisode

function podcastItem(overrides: Partial<PodcastLibraryItem> & { id: string; episodes?: PodcastEpisode[] }): PodcastLibraryItem {
  const { id, episodes, media, ...rest } = overrides
  return {
    id,
    mediaType: 'podcast',
    media: media ?? {
      metadata: { title: 'Podcast' },
      tags: [],
      episodes: episodes ?? []
    },
    ...rest
  } as unknown as PodcastLibraryItem
}

function bookItem(overrides: Partial<BookLibraryItem> & { id: string }): BookLibraryItem {
  const { id, media, ...rest } = overrides
  return {
    id,
    mediaType: 'book',
    media: media ?? {
      metadata: { title: 'Book', authors: [], series: [] },
      tags: []
    },
    ...rest
  } as unknown as BookLibraryItem
}

describe('mergeLibraryItemUpdate', () => {
  it('keeps client-only rssFeed, mediaItemShare, and recentEpisode across snapshot replaces', () => {
    const existing = podcastItem({
      id: 'pod-1',
      rssFeed,
      mediaItemShare,
      recentEpisode,
      episodes: [recentEpisode, { id: 'ep-2' } as PodcastEpisode]
    })
    const updated = podcastItem({
      id: 'pod-1',
      media: {
        metadata: { title: 'Updated podcast' },
        tags: [],
        episodes: [recentEpisode, { id: 'ep-2' } as PodcastEpisode, { id: 'ep-3' } as PodcastEpisode]
      } as unknown as PodcastLibraryItem['media']
    })

    const merged = mergeLibraryItemUpdate(existing, updated)

    expect(merged.media.metadata.title).to.equal('Updated podcast')
    expect(merged.rssFeed).to.equal(rssFeed)
    expect(merged.mediaItemShare).to.equal(mediaItemShare)
    expect(merged.recentEpisode).to.equal(recentEpisode)
  })

  it('drops recentEpisode when that episode is no longer on the snapshot', () => {
    const existing = podcastItem({
      id: 'pod-1',
      recentEpisode,
      episodes: [recentEpisode]
    })
    const updated = podcastItem({
      id: 'pod-1',
      episodes: [{ id: 'ep-other' } as PodcastEpisode]
    })

    expect(mergeLibraryItemUpdate(existing, updated).recentEpisode).to.equal(undefined)
  })

  it('preserves a personalized shelf series ref on books', () => {
    const seriesRef = { id: 'series-1', name: 'Shelf series' }
    const existing = bookItem({
      id: 'book-1',
      media: {
        metadata: { title: 'Old title', authors: [], series: seriesRef },
        tags: []
      } as unknown as BookLibraryItem['media']
    })
    const updated = bookItem({
      id: 'book-1',
      media: {
        metadata: { title: 'New title', authors: [], series: [{ id: 'series-1', name: 'Expanded series', books: [] }] },
        tags: []
      } as unknown as BookLibraryItem['media']
    })

    const merged = mergeLibraryItemUpdate(existing, updated) as BookLibraryItem

    expect(merged.media.metadata.title).to.equal('New title')
    expect(merged.media.metadata.series).to.equal(seriesRef)
  })

  it('still preserves client-only fields when only the latest throttled snapshot is merged', () => {
    const existing = podcastItem({
      id: 'pod-1',
      rssFeed,
      mediaItemShare,
      recentEpisode,
      episodes: [recentEpisode]
    })
    const snapshots: LibraryItem[] = [
      podcastItem({ id: 'pod-1', episodes: [recentEpisode, { id: 'ep-2' } as PodcastEpisode] }),
      podcastItem({ id: 'pod-1', episodes: [recentEpisode, { id: 'ep-2' } as PodcastEpisode, { id: 'ep-3' } as PodcastEpisode] })
    ]
    const latest = snapshots[snapshots.length - 1]

    const merged = mergeLibraryItemUpdate(existing, latest)

    expect(merged.rssFeed).to.equal(rssFeed)
    expect(merged.mediaItemShare).to.equal(mediaItemShare)
    expect(merged.recentEpisode).to.equal(recentEpisode)
    expect((merged.media as PodcastLibraryItem['media']).episodes).to.have.length(3)
  })
})
