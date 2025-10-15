import { apiRequest } from '@/lib/api'

// Server Action
export async function changePassword(oldPassword: string, newPassword: string) {
  'use server'

  const response = await apiRequest('/api/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ password: oldPassword, newPassword })
  })

  return response
}
