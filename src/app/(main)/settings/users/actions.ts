'use server'

import * as api from '@/lib/api'
import { GetListeningSessionsResponse, Library, ListeningStats, UserAccountPayload } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function deleteUser(userId: string): Promise<void> {
  await api.deleteUser(userId)
  revalidatePath('/settings/users')
}

export async function createUser(payload: UserAccountPayload) {
  const result = await api.createUser(payload)
  revalidatePath('/settings/users')
  return result
}

export async function updateUser(userId: string, payload: UserAccountPayload) {
  const result = await api.updateUser(userId, payload)
  if (result.user.accessToken) {
    const currentUser = await api.getCurrentUser()
    if (currentUser.user.id === userId) {
      await api.persistAccessTokenInCookies(result.user.accessToken)
    }
  }
  revalidatePath('/settings/users')
  revalidatePath(`/settings/users/${userId}`)
  return result
}

export async function unlinkUserOpenId(userId: string): Promise<void> {
  await api.unlinkUserOpenId(userId)
  revalidatePath('/settings/users')
}

export async function fetchUserListeningStats(userId: string): Promise<ListeningStats> {
  return api.getUserListeningStats(userId)
}

export async function fetchUserListeningSessions(userId: string, queryParams?: string): Promise<GetListeningSessionsResponse> {
  return api.getUserListeningSessions(userId, queryParams)
}

export async function fetchLibraries(): Promise<Library[]> {
  const response = await api.getLibraries()
  return response.libraries
}

export async function fetchTags(): Promise<string[]> {
  const response = await api.getTags()
  return response.tags
}
