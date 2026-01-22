import { getCurrentUser, getData, getRssFeeds } from '@/lib/api'
import RssFeedsClient from './RssFeedsClient'

export const dynamic = 'force-dynamic'

export default async function RssFeedsPage() {
  const [rssFeedsResponse, currentUser] = await getData(getRssFeeds(), getCurrentUser())
  const rssFeeds = rssFeedsResponse?.feeds || []

  return <RssFeedsClient currentUser={currentUser} rssFeeds={rssFeeds} />
}
