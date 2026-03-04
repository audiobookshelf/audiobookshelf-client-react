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
      <RssFeedsTable rssFeeds={rssFeeds} />
    </SettingsContent>
  )
}
