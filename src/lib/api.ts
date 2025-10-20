import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { cache } from 'react'
import {
  GetLibrariesResponse,
  Library,
  LibraryItem,
  MetadataProvidersResponse,
  PersonalizedShelf,
  SearchLibraryResponse,
  UploadCoverResponse,
  User,
  UserLoginResponse
} from '../types/api'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  needsRefresh?: boolean
}

interface ServerStatus {
  serverVersion: string
  language: string
  isInit: boolean
  authMethods: string[]
  authFormData: Record<string, unknown>
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
export async function apiRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
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

    // Check if body is FormData - if so, don't set Content-Type
    // Node.js fetch will automatically set 'multipart/form-data' with the correct boundary
    const isFormData = options.body instanceof FormData

    const fetchHeaders = new Headers(options.headers as Record<string, string>)

    // Only set Content-Type for non-FormData requests (defaults to application/json)
    if (!isFormData && !fetchHeaders.has('Content-Type')) {
      fetchHeaders.set('Content-Type', 'application/json')
    }

    if (accessToken) {
      fetchHeaders.set('Authorization', `Bearer ${accessToken}`)
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

/**
 * Batch multiple API requests and handle token refresh if needed.
 * If any request requires authentication refresh, redirects to the refresh endpoint.
 *
 * The function preserves the type of each promise, so:
 * const [user, libraries] = await getData(getCurrentUser(), getLibraries())
 * will correctly infer the type of 'user' and 'libraries'.
 */
export const getData = cache(async <T extends Promise<ApiResponse<unknown>>[]>(...promises: T): Promise<{ [K in keyof T]: Awaited<T[K]> }> => {
  const responses = await Promise.all(promises)

  // Check if any response requires token refresh
  const requiresRefresh = responses.some((response) => response.needsRefresh)

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
  return apiRequest<UserLoginResponse>('/api/authorize', {
    method: 'POST',
    cache: 'force-cache'
  })
})

export const getServerStatus = cache(async (): Promise<ApiResponse<ServerStatus>> => {
  return apiRequest<ServerStatus>('/status')
})

export const getLibraries = cache(async () => {
  return apiRequest<GetLibrariesResponse>('/api/libraries', {})
})

export const getLibrary = cache(async (libraryId: string) => {
  return apiRequest<Library>(`/api/libraries/${libraryId}`, {})
})

export const getLibraryPersonalized = cache(async (libraryId: string) => {
  return apiRequest<PersonalizedShelf[]>(`/api/libraries/${libraryId}/personalized`, {})
})

export const getLibraryItems = cache(async (libraryId: string) => {
  return apiRequest<LibraryItem[]>(`/api/libraries/${libraryId}/items`, {})
})

export const getLibraryItem = cache(async (itemId: string) => {
  return apiRequest<LibraryItem>(`/api/items/${itemId}`, {})
})

export const getUsers = cache(async () => {
  return apiRequest<User[]>('/api/users', {})
})

export const getUser = cache(async (userId: string) => {
  return apiRequest<User>(`/api/users/${userId}`, {})
})

/**
 * Upload a cover image file for a library item
 * Returns: { success: true, cover: coverPath }
 */
export async function uploadCover(libraryItemId: string, file: File): Promise<ApiResponse<UploadCoverResponse>> {
  const formData = new FormData()
  formData.set('cover', file)

  return apiRequest<UploadCoverResponse>(`/api/items/${libraryItemId}/cover`, {
    method: 'POST',
    body: formData
  })
}

/**
 * Remove the current cover from a library item
 * Returns: 200 status with no body
 */
export async function removeCover(libraryItemId: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/items/${libraryItemId}/cover`, {
    method: 'DELETE'
  })
}

/**
 * Update cover from a URL
 * Returns: { success: true, cover: coverPath }
 */
export async function updateCoverFromUrl(libraryItemId: string, coverUrl: string): Promise<ApiResponse<UploadCoverResponse>> {
  if (!coverUrl.startsWith('http:') && !coverUrl.startsWith('https:')) {
    return { error: 'Invalid URL' }
  }

  return apiRequest<UploadCoverResponse>(`/api/items/${libraryItemId}/cover`, {
    method: 'POST',
    body: JSON.stringify({ url: coverUrl })
  })
}

/**
 * Set cover from a local file in the library
 * Returns: { success: true, cover: coverPath }
 */
export async function setCoverFromLocalFile(libraryItemId: string, filePath: string): Promise<ApiResponse<UploadCoverResponse>> {
  return apiRequest<UploadCoverResponse>(`/api/items/${libraryItemId}/cover`, {
    method: 'PATCH',
    body: JSON.stringify({ cover: filePath })
  })
}

/**
 * Search library for books, authors, series, etc.
 * @param libraryId - The library to search
 * @param query - Search query string
 * @param limit - Maximum number of results per category (default 12)
 * Returns: Search results grouped by category (books, authors, series, etc.)
 */
export async function searchLibrary(libraryId: string, query: string, limit?: number): Promise<ApiResponse<SearchLibraryResponse>> {
  if (!query || !query.trim()) {
    return { error: 'Search query is required' }
  }

  const params = new URLSearchParams({ q: query.trim() })
  if (limit) {
    params.set('limit', limit.toString())
  }

  return apiRequest<SearchLibraryResponse>(`/api/libraries/${libraryId}/search?${params.toString()}`, {})
}

//
// Search Provider endpoints
//

/**
 * Get all available metadata search providers
 * Returns: Object with providers for books, book covers, and podcasts
 */
export const getMetadataProviders = cache(async () => {
  return apiRequest<MetadataProvidersResponse>('/api/search/providers', {})
})
