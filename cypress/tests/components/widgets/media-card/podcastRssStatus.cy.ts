import type { PodcastMedia } from '@/types/api'
import { getPodcastRssStatusSummary } from '@/components/widgets/media-card/podcastRssStatus'

/** Creates the smallest podcast-media fixture needed by the status mapper tests. */
function podcastMedia(overrides: Partial<PodcastMedia> = {}): PodcastMedia {
  return {
    metadata: {
      genres: [],
      explicit: false,
      title: 'Test Podcast'
    },
    tags: [],
    ...overrides
  }
}

describe('getPodcastRssStatusSummary', () => {
  it('reports a configured feed and enabled schedule', () => {
    expect(
      getPodcastRssStatusSummary(
        podcastMedia({
          metadata: { genres: [], explicit: false, title: 'Test Podcast', feedUrl: 'https://example.com/feed.xml' },
          autoDownloadEpisodes: true,
          autoDownloadSchedule: '0 6 * * 1-5'
        })
      )
    ).to.deep.equal({
      hasFeed: true,
      autoDownloadEnabled: true,
      autoDownloadSchedule: '0 6 * * 1-5'
    })
  })

  it('reports missing or disabled optional settings explicitly', () => {
    expect(getPodcastRssStatusSummary(podcastMedia())).to.deep.equal({
      hasFeed: false,
      autoDownloadEnabled: false,
      autoDownloadSchedule: undefined
    })
  })

  // The reporting issue asks to see what the schedule is set to, not only
  // whether fetching is currently on, so a stored schedule stays visible.
  it('reports a stored schedule even when automatic fetching is disabled', () => {
    expect(
      getPodcastRssStatusSummary(
        podcastMedia({
          metadata: { genres: [], explicit: false, title: 'Test Podcast', feedUrl: 'https://example.com/feed.xml' },
          autoDownloadEpisodes: false,
          autoDownloadSchedule: '0 6 * * 1-5'
        })
      )
    ).to.deep.equal({
      hasFeed: true,
      autoDownloadEnabled: false,
      autoDownloadSchedule: '0 6 * * 1-5'
    })
  })

  // The server persists a cleared schedule as an empty string, so that state
  // must collapse to the same "no schedule" representation as null.
  it('normalizes an empty stored schedule to undefined', () => {
    expect(
      getPodcastRssStatusSummary(
        podcastMedia({
          metadata: { genres: [], explicit: false, title: 'Test Podcast', feedUrl: 'https://example.com/feed.xml' },
          autoDownloadEpisodes: false,
          autoDownloadSchedule: ''
        })
      )
    ).to.deep.equal({
      hasFeed: true,
      autoDownloadEnabled: false,
      autoDownloadSchedule: undefined
    })
  })

  it('normalizes a null stored schedule to undefined', () => {
    expect(
      getPodcastRssStatusSummary(
        podcastMedia({
          metadata: { genres: [], explicit: false, title: 'Test Podcast', feedUrl: 'https://example.com/feed.xml' },
          autoDownloadEpisodes: false,
          autoDownloadSchedule: null as unknown as undefined
        })
      )
    ).to.deep.equal({
      hasFeed: true,
      autoDownloadEnabled: false,
      autoDownloadSchedule: undefined
    })
  })
})
