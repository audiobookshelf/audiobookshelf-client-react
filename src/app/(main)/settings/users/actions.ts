'use server'

import * as api from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function deleteUser(userId: string): Promise<void> {
  await api.deleteUser(userId)
  revalidatePath('/settings/users')
}
