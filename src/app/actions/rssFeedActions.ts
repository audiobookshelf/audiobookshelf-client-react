'use server'

import * as api from '@/lib/api'
import type { OpenRssFeedPayload, OpenRssFeedResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function closeRssFeed(feedId: string): Promise<void> {
  const result = await api.closeRssFeed(feedId)
  revalidatePath('/library', 'layout')
  return result
}

export async function openEntityRssFeed(
  entityType: 'item' | 'collection' | 'series',
  entityId: string,
  payload: OpenRssFeedPayload
): Promise<OpenRssFeedResponse> {
  const result = await api.openEntityRssFeed(entityType, entityId, payload)
  revalidatePath('/library', 'layout')
  return result
}
