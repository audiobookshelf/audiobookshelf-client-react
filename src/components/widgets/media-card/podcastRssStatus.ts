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
  /**
   * The persisted cron expression, when the podcast has one stored.
   *
   * Reported whether or not automatic fetching is currently enabled, so the
   * card can answer "what is the schedule set to?" for a podcast that is
   * switched off. Consumers must pair this with `autoDownloadEnabled` before
   * implying the schedule is actually running.
   */
  autoDownloadSchedule?: string
}

/**
 * Maps the API's optional podcast settings to the card's explicit display state.
 *
 * Keeping this conversion outside the component makes the distinction between a
 * missing feed, disabled fetching, and a stored-but-inactive schedule easy to
 * test, and preserves the API's optional-field semantics at the UI boundary.
 *
 * The server represents "no schedule" as either `null` or an empty string, so
 * both are normalized to `undefined` and the summary keeps a single
 * representation for that state.
 */
export function getPodcastRssStatusSummary(media: PodcastMedia): PodcastRssStatusSummary {
  return {
    hasFeed: Boolean(media.metadata.feedUrl),
    autoDownloadEnabled: media.autoDownloadEpisodes ?? false,
    autoDownloadSchedule: media.autoDownloadSchedule || undefined
  }
}
