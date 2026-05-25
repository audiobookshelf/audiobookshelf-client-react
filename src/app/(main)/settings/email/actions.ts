'use server'

import * as api from '@/lib/api'
import { ApiError } from '@/lib/apiErrors'
import { EmailSettingsFormFields, EReaderDevice } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function updateEmailSettings(payload: EmailSettingsFormFields) {
  const result = await api.updateEmailSettings(payload)
  revalidatePath('/settings/email')
  return result
}

export type SendTestEmailResult = { success: true } | { success: false; error: string }

export async function updateEReaderDevices(ereaderDevices: EReaderDevice[]) {
  const result = await api.updateEReaderDevices(ereaderDevices)
  revalidatePath('/settings/email')
  return result
}

export async function sendTestEmail(): Promise<SendTestEmailResult> {
  try {
    await api.sendTestEmail()
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError && error.message.trim()) {
      return { success: false, error: error.message }
    }
    console.error('Failed to send test email', error)
    return { success: false, error: '' }
  }
}
