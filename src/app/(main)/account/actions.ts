'use server'

import { deleteAuthSession as deleteAuthSessionRequest, getAuthSessions as getAuthSessionsRequest } from '@/lib/api'
import type { GetAuthSessionsResponse } from '@/types/api'

const AUTH_SESSIONS_PER_PAGE = 10

export async function getAuthSessions(page = 0): Promise<GetAuthSessionsResponse> {
  return getAuthSessionsRequest(page, AUTH_SESSIONS_PER_PAGE)
}

export async function deleteAuthSession(sessionId: string): Promise<void> {
  return deleteAuthSessionRequest(sessionId)
}
