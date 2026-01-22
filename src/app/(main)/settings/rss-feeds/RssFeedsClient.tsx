'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { RssFeed, UserLoginResponse } from '@/types/api'
import SettingsContent from '../SettingsContent'
import RssFeedsTable from './RssFeedsTable'

interface RssFeedsClientProps {
  rssFeeds: RssFeed[]
  currentUser: UserLoginResponse
}

export default function RssFeedsClient({ rssFeeds, currentUser }: RssFeedsClientProps) {
  const t = useTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderRSSFeeds')} moreInfoUrl="https://www.audiobookshelf.org/guides/rss_feeds">
      <RssFeedsTable currentUser={currentUser} rssFeeds={rssFeeds} />
    </SettingsContent>
  )
}
