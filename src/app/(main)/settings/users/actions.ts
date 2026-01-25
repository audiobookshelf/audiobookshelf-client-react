'use server'

import * as api from '@/lib/api'
import { Library } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function deleteUser(userId: string): Promise<void> {
  await api.deleteUser(userId)
  revalidatePath('/settings/users')
}

export async function fetchLibraries(): Promise<Library[]> {
  const response = await api.getLibraries()
  return response.libraries
}

export async function fetchTags(): Promise<string[]> {
  const response = await api.getTags()
  return response.tags
}
