'use server'

import * as api from '@/lib/api'
import type { OpenMediaItemSharePayload } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function openMediaItemShareAction(payload: OpenMediaItemSharePayload) {
  const result = await api.openMediaItemShare(payload)
  revalidatePath('/library', 'layout')
  return result
}

export async function closeMediaItemShareAction(shareId: string) {
  const result = await api.closeMediaItemShare(shareId)
  revalidatePath('/library', 'layout')
  return result
}
