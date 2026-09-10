import { getData, getRssFeeds } from '@/lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import RssFeedsClient from './RssFeedsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsRssFeeds')
}

export default async function RssFeedsPage() {
  const [rssFeedsResponse] = await getData(getRssFeeds())
  const rssFeeds = rssFeedsResponse?.feeds || []

  return <RssFeedsClient rssFeeds={rssFeeds} />
}
