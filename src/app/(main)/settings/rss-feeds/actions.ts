'use server'

import * as api from '@/lib/api'

export async function closeRssFeed(feedId: string): Promise<void> {
  return api.closeRssFeed(feedId)
}
