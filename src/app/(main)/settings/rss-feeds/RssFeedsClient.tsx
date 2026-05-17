'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { RssFeed } from '@/types/api'
import SettingsContent from '../SettingsContent'
import RssFeedsTable from './RssFeedsTable'

interface RssFeedsClientProps {
  rssFeeds: RssFeed[]
}

export default function RssFeedsClient({ rssFeeds }: RssFeedsClientProps) {
  const t = useTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderRSSFeeds')} moreInfoUrl="https://www.audiobookshelf.org/guides/rss_feeds">
      {rssFeeds.length > 0 ? <RssFeedsTable rssFeeds={rssFeeds} /> : <p className="text-foreground py-8 text-center text-lg">{t('MessageNoRssFeeds')}</p>}
    </SettingsContent>
  )
}
