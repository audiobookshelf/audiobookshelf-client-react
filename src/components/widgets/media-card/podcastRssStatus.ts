import type { PodcastMedia } from '@/types/api'

/**
 * The read-only RSS and automatic-download state shown on a podcast library card.
 *
 * This deliberately contains persisted podcast settings only. Generated
 * Audiobookshelf sharing feeds are represented separately by `LibraryItem.rssFeed`
 * and are not part of podcast episode-fetch scheduling.
 */
export interface PodcastRssStatusSummary {
  /** Whether the podcast has a source RSS URL for fetching episodes. */
  hasFeed: boolean
  /** Whether automatic episode fetching is enabled for this podcast. */
  autoDownloadEnabled: boolean
  /** The persisted cron expression, when automatic fetching is enabled. */
  autoDownloadSchedule?: string
}

/**
 * Maps the API's optional podcast settings to the card's explicit display state.
 *
 * Keeping this conversion outside the component makes the distinction between a
 * missing feed and a disabled schedule easy to test and preserves the API's
 * optional-field semantics at the UI boundary.
 */
export function getPodcastRssStatusSummary(media: PodcastMedia): PodcastRssStatusSummary {
  const autoDownloadEnabled = media.autoDownloadEpisodes ?? false

  return {
    hasFeed: Boolean(media.metadata.feedUrl),
    autoDownloadEnabled,
    autoDownloadSchedule: autoDownloadEnabled ? media.autoDownloadSchedule : undefined
  }
}
