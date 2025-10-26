import { apiRequest } from '@/lib/api'

// Server Action
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  'use server'

  return apiRequest<void>('/api/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ password: oldPassword, newPassword })
  })
}
