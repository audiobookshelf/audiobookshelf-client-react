'use server'

import * as api from '@/lib/api'
import { revalidatePath } from 'next/cache'

export async function createBackup(): Promise<void> {
  await api.createBackup()
  revalidatePath('/settings/backups')
}

export async function deleteBackup(backupId: string): Promise<void> {
  await api.deleteBackup(backupId)
  revalidatePath('/settings/backups')
}

// Server Action to update the backup path
export async function updateBackupPath(path: string): Promise<boolean> {
  try {
    await api.apiRequest<void>('/api/backups/path', {
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
