'use server'

import * as api from '@/lib/api'
import { GetListeningSessionsResponse, GetOpenListeningSessionsResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

export interface ListeningSessionsQueryParams {
  page: number
  itemsPerPage: number
  sort: string
  desc: boolean
  user?: string
}

export async function getListeningSessionsData(params: ListeningSessionsQueryParams): Promise<GetListeningSessionsResponse> {
  const queryParams = new URLSearchParams()
  queryParams.set('page', String(params.page))
  queryParams.set('itemsPerPage', String(params.itemsPerPage))
  queryParams.set('sort', params.sort)
  queryParams.set('desc', params.desc ? '1' : '0')

  if (params.user) {
    queryParams.set('user', params.user)
  }

  return api.getListeningSessions(queryParams.toString())
}

export async function getOpenListeningSessionsData(): Promise<GetOpenListeningSessionsResponse> {
  return api.getOpenListeningSessions()
}

export async function batchDeleteListeningSessions(sessionIds: string[]): Promise<void> {
  await api.batchDeleteListeningSessions(sessionIds)
  revalidatePath('/settings/listening-sessions')
}

export async function deleteListeningSession(sessionId: string): Promise<void> {
  await api.deleteListeningSession(sessionId)
  revalidatePath('/settings/listening-sessions')
}

export async function closeListeningSession(sessionId: string): Promise<void> {
  await api.closeListeningSession(sessionId)
  revalidatePath('/settings/listening-sessions')
}
