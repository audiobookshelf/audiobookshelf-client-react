'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { RssFeed } from '@/types/api'
import SettingsContent from '../SettingsContent'
import { SETTINGS_MORE_INFO_URLS } from '../settingsNavItems'
import RssFeedsTable from './RssFeedsTable'

interface RssFeedsClientProps {
  rssFeeds: RssFeed[]
}

export default function RssFeedsClient({ rssFeeds }: RssFeedsClientProps) {
  const t = useTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderRSSFeeds')} moreInfoUrl={SETTINGS_MORE_INFO_URLS.rssFeeds}>
      {rssFeeds.length > 0 ? <RssFeedsTable rssFeeds={rssFeeds} /> : <p className="text-foreground py-8 text-center text-lg">{t('MessageNoRssFeeds')}</p>}
    </SettingsContent>
  )
}
