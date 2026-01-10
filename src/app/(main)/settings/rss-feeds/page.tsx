import { getData, getRssFeeds } from '@/lib/api'
import RssFeedsClient from './RssFeedsClient'

export const dynamic = 'force-dynamic'

export default async function RssFeedsPage() {
  const [rssFeedsResponse] = await getData(getRssFeeds())
  const rssFeeds = rssFeedsResponse?.feeds || []

  return <RssFeedsClient rssFeeds={rssFeeds} />
}
