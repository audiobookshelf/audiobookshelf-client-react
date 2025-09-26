import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function RssFeedsPage() {
  const t = await getTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderRSSFeeds')} moreInfoUrl="https://www.audiobookshelf.org/guides/rss_feeds">
      <div></div>
    </SettingsContent>
  )
}
