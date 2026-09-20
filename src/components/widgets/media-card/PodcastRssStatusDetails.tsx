'use client'

import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getHumanReadableCronExpression } from '@/lib/cron'
import type { PodcastRssStatusSummary } from './podcastRssStatus'

/**
 * Props for the read-only podcast RSS status summary.
 */
export interface PodcastRssStatusDetailsProps {
  /** The persisted source-feed and automatic-download state to display. */
  status: PodcastRssStatusSummary
  /** Optional `cy-id` value for an integration-test or review selector. */
  cyId?: string
}

/**
 * Renders the source-feed and automatic-download state shared by podcast cards
 * and the podcast edit modal.
 *
 * A stored schedule is shown even while automatic fetching is disabled, because
 * the reporting issue asks to see "if the RSS feed is enabled **or** what the
 * schedule is set to". The heading distinguishes the two cases so an inactive
 * schedule is never mistaken for a running one.
 *
 * This component intentionally reports state only. The existing schedule,
 * episode-search, and check-for-new-episodes actions remain responsible for
 * changing that state through their established flows.
 */
export default function PodcastRssStatusDetails({ status, cyId }: PodcastRssStatusDetailsProps) {
  const t = useTypeSafeTranslations()
  const { serverSettings } = useUser()

  return (
    <div cy-id={cyId} className="text-foreground-muted">
      <p className="truncate">{status.hasFeed ? t('LabelPodcastFeedConfigured') : t('LabelPodcastFeedMissing')}</p>
      <p className="truncate">{status.autoDownloadEnabled ? t('LabelPodcastAutoDownloadEnabled') : t('LabelPodcastAutoDownloadDisabled')}</p>
      {status.autoDownloadSchedule && (
        <p className="truncate" cy-id="podcast-rss-status-schedule">
          {status.autoDownloadEnabled ? t('LabelScheduleHeading') : t('LabelPodcastScheduleInactiveHeading')}{' '}
          {getHumanReadableCronExpression(status.autoDownloadSchedule, serverSettings?.language || 'en')}
        </p>
      )}
    </div>
  )
}
