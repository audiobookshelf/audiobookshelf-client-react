'use server'

import {
  deleteAuthSession as deleteAuthSessionRequest,
  getAuthSessions as getAuthSessionsRequest,
  updateMyEReaderDevices as updateMyEReaderDevicesRequest
} from '@/lib/api'
import { ApiError } from '@/lib/apiErrors'
import type { EReaderDevice, GetAuthSessionsResponse } from '@/types/api'

export type UpdateMyEReaderDevicesResult = { ok: true; ereaderDevices: EReaderDevice[] } | { ok: false; duplicate: boolean }

export async function updateMyEReaderDevices(ereaderDevices: EReaderDevice[]): Promise<UpdateMyEReaderDevicesResult> {
  try {
    const result = await updateMyEReaderDevicesRequest(ereaderDevices)
    return { ok: true, ereaderDevices: result.ereaderDevices }
  } catch (error) {
    const duplicate = error instanceof ApiError && error.message.toLowerCase().includes('duplicate')
    if (!duplicate) console.error('Failed to update ereader devices', error)
    return { ok: false, duplicate }
  }
}

const AUTH_SESSIONS_PER_PAGE = 10

export async function getAuthSessions(page = 0): Promise<GetAuthSessionsResponse> {
  return getAuthSessionsRequest(page, AUTH_SESSIONS_PER_PAGE)
}

export async function deleteAuthSession(sessionId: string): Promise<void> {
  return deleteAuthSessionRequest(sessionId)
}
