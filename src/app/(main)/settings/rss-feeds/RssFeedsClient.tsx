'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { RssFeed } from '@/types/api'
import SettingsContent from '../SettingsContent'

interface RssFeedsClientProps {
  rssFeeds: RssFeed[]
}

export default function RssFeedsClient({ rssFeeds }: RssFeedsClientProps) {
  const t = useTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderRSSFeeds')} moreInfoUrl="https://www.audiobookshelf.org/guides/rss_feeds">
      <div className="flex flex-col gap-2 py-4">
        {rssFeeds.map((rssFeed) => (
          <div key={rssFeed.id}>{rssFeed.meta.title}</div>
        ))}
      </div>
    </SettingsContent>
  )
}
