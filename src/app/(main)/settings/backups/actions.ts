'use server'

import { apiRequest } from '@/lib/api'
import { revalidatePath } from 'next/cache'

// Server Action to update the backup path
export async function updateBackupPath(path: string): Promise<boolean> {
  try {
    await apiRequest<void>('/api/backups/path', {
      method: 'PATCH',
      body: JSON.stringify({ path })
    })

    revalidatePath('/settings/backups')

    return true
  } catch (error) {
    console.error('Error updating backup path:', error)
    return false
  }
}
