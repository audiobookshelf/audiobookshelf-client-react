import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { cache } from 'react'

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  needsRefresh?: boolean
}

interface ServerStatus {
  serverVersion: string
  language: string
  isInit: boolean
  authMethods: string[]
  authFormData: Record<string, any>
  ConfigPath: string
  MetadataPath: string
  app: string
}

const publicEndpoints = ['/status']
const RefreshTokenExpiry = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '') || 7 * 24 * 60 * 60 // 7 days
const AccessTokenExpiry = parseInt(process.env.ACCESS_TOKEN_EXPIRY || '') || 12 * 60 * 60 // 12 hours

export function getServerBaseUrl() {
  let host = process.env.HOST || 'localhost'
  if (host === '0.0.0.0') {
    // Convert "all interfaces" address to localhost for internal API calls
    host = 'localhost'
  }
  return `http://${host}:${process.env.PORT || '3333'}`
}

/**
 * User "Home" page is the default library page, or settings/account page if no libraries are set yet
 */
export function getUserDefaultUrlPath(userDefaultLibraryId: string | null, userType: string) {
  const isAdmin = ['admin', 'root'].includes(userType)
  return userDefaultLibraryId ? `/library/${userDefaultLibraryId}` : isAdmin ? '/settings' : '/account'
}

/**
 * The NextJS server sets its own cookies separate from the Audiobookshelf server.
 * Because the Abs Server cookies are not available to NextJS for server-side rendering.
 */
export function setTokenCookies(response: NextResponse, accessToken: string, refreshToken: string | null) {
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    // Ensure the cookie is not expired before the access token expires (5 second buffer)
    maxAge: Math.max(AccessTokenExpiry - 5, 5)
  })

  if (refreshToken) {
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      // Ensure the cookie is not expired before the refresh token expires (5 second buffer)
      maxAge: Math.max(RefreshTokenExpiry - 5, 5)
    })
  }
}

export async function getAccessToken() {
  return (await cookies()).get('access_token')?.value || null
}

/**
 * Make an authenticated API request to the server
 */
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    let accessToken: string | null = null

    if (!publicEndpoints.includes(endpoint)) {
      accessToken = (await cookies()).get('access_token')?.value || null
      if (!accessToken) {
        return { error: 'No authentication token found', needsRefresh: true }
      }
    }

    const baseUrl = getServerBaseUrl()
    const url = `${baseUrl}${endpoint}`

    const fetchHeaders: Record<string, any> = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (accessToken) {
      fetchHeaders.Authorization = `Bearer ${accessToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers: fetchHeaders
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Return special response indicating refresh is needed
        return { error: 'Unauthorized', needsRefresh: true }
      }
      return { error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    console.error('API request failed:', error)
    return { error: 'Network error' }
  }
}

export const getData = cache(async <T extends readonly Promise<ApiResponse<any>>[]>(...promises: T): Promise<{ [K in keyof T]: Awaited<T[K]> }> => {
  const responses = await Promise.all(promises)

  let requiresRefresh = false
  for (const response of responses) {
    if (response.needsRefresh) {
      requiresRefresh = true
    }
  }

  if (requiresRefresh) {
    const currentPath = (await headers()).get('x-current-path')
    return redirect(`/internal-api/refresh?redirect=${encodeURIComponent(currentPath || '')}`)
  }

  return responses as { [K in keyof T]: Awaited<T[K]> }
})

/**
 * Current user response data
 */
export const getCurrentUser = cache(async () => {
  return apiRequest('/api/authorize', {
    method: 'POST',
    cache: 'force-cache'
  })
})

export const getServerStatus = cache(async (): Promise<ApiResponse<ServerStatus>> => {
  return apiRequest('/status')
})

export const getLibraries = cache(async () => {
  return apiRequest('/api/libraries', {})
})

export const getLibrary = cache(async (libraryId: string) => {
  return apiRequest(`/api/libraries/${libraryId}`, {})
})

export const getLibraryPersonalized = cache(async (libraryId: string) => {
  return apiRequest(`/api/libraries/${libraryId}/personalized`, {})
})

export const getLibraryItems = cache(async (libraryId: string) => {
  return apiRequest(`/api/libraries/${libraryId}/items`, {})
})

export const getLibraryItem = cache(async (itemId: string) => {
  return apiRequest(`/api/items/${itemId}`, {})
})

export const getUsers = cache(async () => {
  return apiRequest('/api/users', {})
})

export const getUser = cache(async (userId: string) => {
  return apiRequest(`/api/users/${userId}`, {})
})
