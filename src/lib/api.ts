import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { cache } from 'react'
import {
  Author,
  BookSearchResult,
  FFProbeData,
  GetAuthorsResponse,
  GetLibrariesResponse,
  GetLibraryItemsResponse,
  GetNarratorsResponse,
  GetUsersResponse,
  Library,
  LibraryItem,
  MetadataProvidersResponse,
  PersonalizedShelf,
  PodcastSearchResult,
  SearchLibraryResponse,
  Series,
  ServerStatus,
  TasksResponse,
  UpdateLibraryItemMediaPayload,
  UpdateLibraryItemMediaResponse,
  UploadCoverResponse,
  User,
  UserLoginResponse
} from '../types/api'

/**
 * Custom error classes for API error handling
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(
    message = 'Network error',
    public cause?: unknown
  ) {
    super(message)
    this.name = 'NetworkError'
  }
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
 * Throws UnauthorizedError, ApiError, or NetworkError on failure
 */
export async function apiRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    let accessToken: string | null = null

    if (!publicEndpoints.includes(endpoint)) {
      accessToken = (await cookies()).get('access_token')?.value || null
      if (!accessToken) {
        throw new UnauthorizedError('No authentication token found')
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
        throw new UnauthorizedError('Unauthorized')
      }

      const errorMessage = await response.text()
      throw new ApiError(errorMessage || `HTTP ${response.status}: ${response.statusText}`, response.status, response.statusText)
    }

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')

    // If no content or explicit 204 No Content status, return empty data
    if (response.status === 204 || contentLength === '0') {
      return undefined as T
    }

    // If there's a content-type header and it's JSON, parse it
    if (contentType?.includes('application/json')) {
      const data = await response.json()
      return data as T
    }

    // Try to get text content, if empty return undefined
    const text = await response.text()
    if (!text || text.trim() === '') {
      return undefined as T
    }

    // Try to parse as JSON, fallback to undefined if it fails
    try {
      const data = JSON.parse(text)
      return data as T
    } catch {
      return undefined as T
    }
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof UnauthorizedError || error instanceof ApiError) {
      throw error
    }
    // Wrap other errors in NetworkError
    console.error('API request failed:', error)
    throw new NetworkError('Network error', error)
  }
}

/**
 * Batch multiple API requests and handle token refresh if needed.
 * If any request throws UnauthorizedError, redirects to the refresh endpoint.
 *
 * The function preserves the type of each promise, so:
 * const [user, libraries] = await getData(getCurrentUser(), getLibraries())
 * will correctly infer the type of 'user' and 'libraries'.
 */
export const getData = cache(async <T extends Promise<unknown>[]>(...promises: T): Promise<{ [K in keyof T]: Awaited<T[K]> }> => {
  try {
    const responses = await Promise.all(promises)
    return responses as { [K in keyof T]: Awaited<T[K]> }
  } catch (error) {
    // If any request is unauthorized, redirect to refresh token endpoint
    if (error instanceof UnauthorizedError) {
      const currentPath = (await headers()).get('x-current-path')
      return redirect(`/internal-api/refresh?redirect=${encodeURIComponent(currentPath || '')}`)
    }
    // Let other errors propagate (Next.js error boundaries will handle them)
    throw error
  }
})

/**
 * Current user response data
 *
 * call revalidateTag('current-user') when server settings change or user is updated
 */
export const getCurrentUser = cache(async (): Promise<UserLoginResponse> => {
  return apiRequest<UserLoginResponse>('/api/authorize', {
    method: 'POST',
    next: { tags: ['current-user'] }
  })
})

export const getServerStatus = cache(async (): Promise<ServerStatus> => {
  return apiRequest<ServerStatus>('/status')
})

export const getLibraries = cache(async (): Promise<GetLibrariesResponse> => {
  return apiRequest<GetLibrariesResponse>('/api/libraries', {})
})

export const getLibrary = cache(async (libraryId: string): Promise<Library> => {
  return apiRequest<Library>(`/api/libraries/${libraryId}`, {})
})

export const getLibraryPersonalized = cache(async (libraryId: string): Promise<PersonalizedShelf[]> => {
  return apiRequest<PersonalizedShelf[]>(`/api/libraries/${libraryId}/personalized`, {})
})

export const getLibraryItems = cache(async (libraryId: string): Promise<GetLibraryItemsResponse> => {
  return apiRequest<GetLibraryItemsResponse>(`/api/libraries/${libraryId}/items`, {})
})

export const getLibraryItem = cache(async (itemId: string, expanded?: boolean): Promise<LibraryItem> => {
  return apiRequest<LibraryItem>(`/api/items/${itemId}?expanded=${expanded ? '1' : '0'}`, {})
})

/**
 * Get FFProbe data for an audio file
 * Admin-only endpoint that returns raw ffprobe output
 * @param itemId - Library item ID
 * @param fileIno - Audio file inode
 * Returns: FFProbe data object
 */
export async function getAudioFileFFProbeData(itemId: string, fileIno: string): Promise<FFProbeData> {
  return apiRequest<FFProbeData>(`/api/items/${itemId}/ffprobe/${fileIno}`, {})
}

export const getUsers = cache(async (): Promise<GetUsersResponse> => {
  return apiRequest<GetUsersResponse>('/api/users', {})
})

export const getUser = cache(async (userId: string): Promise<User> => {
  return apiRequest<User>(`/api/users/${userId}`, {})
})

/**
 * Upload a cover image file for a library item
 * Returns: { success: true, cover: coverPath }
 */
export async function uploadCover(libraryItemId: string, file: File): Promise<UploadCoverResponse> {
  const formData = new FormData()
  formData.append('cover', file, file.name)

  return apiRequest<UploadCoverResponse>(`/api/items/${libraryItemId}/cover`, {
    method: 'POST',
    body: formData
  })
}

/**
 * Remove the current cover from a library item
 * Returns: 200 status with no body
 */
export async function removeCover(libraryItemId: string): Promise<void> {
  return apiRequest<void>(`/api/items/${libraryItemId}/cover`, {
    method: 'DELETE'
  })
}

/**
 * Delete a library file from a library item
 * Returns: 200 status with no body
 */
export async function deleteLibraryFile(libraryItemId: string, fileIno: string): Promise<void> {
  return apiRequest<void>(`/api/items/${libraryItemId}/file/${fileIno}`, {
    method: 'DELETE'
  })
}

/**
 * Update cover from a URL
 * Returns: { success: true, cover: coverPath }
 */
export async function updateCoverFromUrl(libraryItemId: string, coverUrl: string): Promise<UploadCoverResponse> {
  if (!coverUrl.startsWith('http:') && !coverUrl.startsWith('https:')) {
    throw new ApiError('Invalid URL', 400, 'Bad Request')
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
export async function setCoverFromLocalFile(libraryItemId: string, filePath: string): Promise<UploadCoverResponse> {
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
export async function searchLibrary(libraryId: string, query: string, limit?: number): Promise<SearchLibraryResponse> {
  if (!query || !query.trim()) {
    throw new ApiError('Search query is required', 400, 'Bad Request')
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
export const getMetadataProviders = cache(async (): Promise<MetadataProvidersResponse> => {
  return apiRequest<MetadataProvidersResponse>('/api/search/providers', {})
})

export const getTags = cache(async () => {
  return apiRequest<{ tags: string[] }>('/api/tags', {})
})

export const getGenres = cache(async () => {
  return apiRequest<{ genres: string[] }>('/api/genres', {})
})

export const getNarrators = cache(async (libraryId: string) => {
  return apiRequest<GetNarratorsResponse>(`/api/libraries/${libraryId}/narrators`, {})
})

export const getAuthors = cache(async (libraryId: string) => {
  return apiRequest<GetAuthorsResponse>(`/api/libraries/${libraryId}/authors`, {})
})

export const getAuthor = cache(async (authorId: string): Promise<Author> => {
  return apiRequest<Author>(`/api/authors/${authorId}`, {})
})

export const getSeries = cache(async (libraryId: string, seriesId: string): Promise<Series> => {
  return apiRequest<Series>(`/api/libraries/${libraryId}/series/${seriesId}`, {})
})

/**
 * Search for books using a metadata provider
 * @param provider - The metadata provider to use (e.g., 'google', 'audible', etc.)
 * @param title - Book title to search for
 * @param author - Optional author name
 * @param libraryItemId - Optional library item ID for context
 * Returns: Array of book match results
 */
export async function searchBooks(provider: string, title: string, author?: string, libraryItemId?: string): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    provider,
    fallbackTitleOnly: '1',
    title: title.trim()
  })

  if (author) {
    params.set('author', author.trim())
  }

  if (libraryItemId) {
    params.set('id', libraryItemId)
  }

  return apiRequest<BookSearchResult[]>(`/api/search/books?${params.toString()}`, {})
}

/**
 * Search for podcasts
 * @param term - Search term or RSS feed URL
 * Returns: Array of podcast match results
 */
export async function searchPodcasts(term: string): Promise<PodcastSearchResult[]> {
  const params = new URLSearchParams({
    term: term.trim()
  })

  return apiRequest<PodcastSearchResult[]>(`/api/search/podcast?${params.toString()}`, {})
}

/**
 * Update library item media (metadata, tags, cover)
 * @param libraryItemId - Library item ID
 * @param updatePayload - Update payload with metadata, tags, and optionally url for cover
 * Returns: { updated: boolean, libraryItem?: LibraryItem }
 */
export async function updateLibraryItemMedia(libraryItemId: string, updatePayload: UpdateLibraryItemMediaPayload): Promise<UpdateLibraryItemMediaResponse> {
  return apiRequest<UpdateLibraryItemMediaResponse>(`/api/items/${libraryItemId}/media`, {
    method: 'PATCH',
    body: JSON.stringify(updatePayload)
  })
}

/**
 * Quick embed metadata into audio files for a library item
 * @param libraryItemId - Library item ID
 * Returns: void (success) or throws error
 */
export async function embedMetadataQuick(libraryItemId: string): Promise<void> {
  return apiRequest<void>(`/api/tools/item/${libraryItemId}/embed-metadata`, {
    method: 'POST'
  })
}

/**
 * Get all tasks with optional queue data
 * Returns: Tasks array and queued task data
 */
export async function getTasks(): Promise<TasksResponse> {
  return apiRequest<TasksResponse>('/api/tasks?include=queue', {})
}
