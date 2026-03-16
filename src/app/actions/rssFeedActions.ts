'use server'

import * as api from '@/lib/api'
import type { OpenRssFeedPayload, OpenRssFeedResponse } from '@/types/api'

export async function closeRssFeed(feedId: string): Promise<void> {
  return api.closeRssFeed(feedId)
}

export async function openItemRssFeed(itemId: string, payload: OpenRssFeedPayload): Promise<OpenRssFeedResponse> {
  return api.openItemRssFeed(itemId, payload)
}
