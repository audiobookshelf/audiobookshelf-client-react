'use server'

import * as api from '@/lib/api'
import { ApiError } from '@/lib/apiErrors'
import { NotificationFormPayload, NotificationSettingsPatch, NotificationUpdatePayload } from '@/types/api'
import { revalidatePath } from 'next/cache'

export type NotificationTestResult = { success: true } | { success: false; error: string }

export async function updateNotificationSettings(payload: NotificationSettingsPatch) {
  await api.updateNotificationSettings(payload)
  revalidatePath('/settings/notifications')
}

export async function createNotification(payload: NotificationFormPayload) {
  const result = await api.createNotification(payload)
  revalidatePath('/settings/notifications')
  return result
}

export async function updateNotification(id: string, payload: NotificationUpdatePayload) {
  const result = await api.updateNotification(id, payload)
  revalidatePath('/settings/notifications')
  return result
}

export async function deleteNotification(id: string) {
  const result = await api.deleteNotification(id)
  revalidatePath('/settings/notifications')
  return result
}

export async function testNotification(id: string): Promise<NotificationTestResult> {
  try {
    await api.testNotification(id)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError && error.message.trim()) {
      return { success: false, error: error.message }
    }
    console.error('Notification test failed', error)
    return { success: false, error: '' }
  }
}

export async function triggerOnTestEvent(fail: boolean): Promise<NotificationTestResult> {
  try {
    await api.triggerOnTestEvent(fail)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError && error.message.trim()) {
      return { success: false, error: error.message }
    }
    console.error('Notification test failed', error)
    return { success: false, error: '' }
  }
}
