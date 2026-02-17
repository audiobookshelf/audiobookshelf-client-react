import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { cache } from 'react'
import {
  Author,
  AuthorImagePayload,
  AuthorQuickMatchPayload,
  AuthorResponse,
  AuthorUpdateResponse,
  BookSearchResult,
  Collection,
  CreatePlaylistFromCollectionResponse,
  CreateApiKeyPayload,
  CreateUpdateApiKeyResponse,
  FFProbeData,
  GenresResponse,
  GetApiKeysResponse,
  GetAuthorsResponse,
  GetBackupsResponse,
  GetCollectionsResponse,
  GetFilesystemPathsResponse,
  GetLibrariesResponse,
  GetLibraryItemsResponse,
  GetLoggerDataResponse,
  GetNarratorsResponse,
  GetPlaylistsResponse,
  GetRssFeedsResponse,
  GetSeriesResponse,
  GetUsersResponse,
  Library,
  LibraryFilterData,
  LibraryItem,
  MetadataProvidersResponse,
  PersonalizedShelf,
  Playlist,
  PodcastSearchResult,
  RescanLibraryItemResponse,
  SaveLibraryOrderPayload,
  SaveLibraryOrderApiResponse,
  SearchLibraryResponse,
  SendEbookToDevicePayload,
  SetCoverFromLocalFilePayload,
  Series,
  ServerStatus,
  TagsResponse,
  TasksResponse,
  UpdateCollectionPayload,
  UpdateAuthorPayload,
  UpdateLibraryItemMediaPayload,
  UpdateLibraryItemMediaResponse,
  UpdateCoverFromUrlPayload,
  UpdateMediaFinishedPayload,
  UploadCoverResponse,
  User,
  UserLoginResponse
} from '../types/api'
import { apiRegistry } from './apiRegistry'

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

function buildPath(template: string, params: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key]
    if (value === undefined || value === null) {
      throw new Error(`Missing path param: ${key}`)
    }
    return encodeURIComponent(String(value))
  })
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
  const endpoint = apiRegistry.getCurrentUser
  return apiRequest<UserLoginResponse>(endpoint.path, {
    method: endpoint.method,
    next: { tags: ['current-user'] }
  })
})

export const getServerStatus = cache(async (): Promise<ServerStatus> => {
  const endpoint = apiRegistry.getServerStatus
  return apiRequest<ServerStatus>(endpoint.path, { method: endpoint.method })
})

export const getLibraries = cache(async (): Promise<GetLibrariesResponse> => {
  const endpoint = apiRegistry.getLibraries
  return apiRequest<GetLibrariesResponse>(endpoint.path, { method: endpoint.method })
})

export const getLibrary = cache(async (libraryId: string): Promise<Library> => {
  const endpoint = apiRegistry.getLibrary
  return apiRequest<Library>(buildPath(endpoint.path, { libraryId }), { method: endpoint.method })
})

export const getLibraryPersonalized = cache(async (libraryId: string): Promise<PersonalizedShelf[]> => {
  const endpoint = apiRegistry.getLibraryPersonalized
  return apiRequest<PersonalizedShelf[]>(buildPath(endpoint.path, { libraryId }), { method: endpoint.method })
})

export const getLibraryItems = cache(async (libraryId: string, queryParams?: string): Promise<GetLibraryItemsResponse> => {
  const endpoint = apiRegistry.getLibraryItems
  const basePath = buildPath(endpoint.path, { libraryId })
  const url = queryParams ? `${basePath}?${queryParams}` : basePath
  return apiRequest<GetLibraryItemsResponse>(url, { method: endpoint.method })
})

/**
 * Get filter data for a library (genres, tags, authors, series, etc.)
 * Used for populating filter dropdown menus
 */
export async function getLibraryFilterData(libraryId: string): Promise<LibraryFilterData> {
  const endpoint = apiRegistry.getLibraryFilterData
  return apiRequest<LibraryFilterData>(buildPath(endpoint.path, { libraryId }), { method: endpoint.method })
}

export const getLibraryItem = cache(async (itemId: string, expanded?: boolean): Promise<LibraryItem> => {
  const endpoint = apiRegistry.getLibraryItem
  const basePath = buildPath(endpoint.path, { itemId })
  const url = `${basePath}?expanded=${expanded ? '1' : '0'}`
  return apiRequest<LibraryItem>(url, { method: endpoint.method })
})

/**
 * Get FFProbe data for an audio file
 * Admin-only endpoint that returns raw ffprobe output
 * @param itemId - Library item ID
 * @param fileIno - Audio file inode
 * Returns: FFProbe data object
 */
export async function getAudioFileFFProbeData(itemId: string, fileIno: string): Promise<FFProbeData> {
  const endpoint = apiRegistry.getAudioFileFFProbeData
  return apiRequest<FFProbeData>(buildPath(endpoint.path, { itemId, fileIno }), { method: endpoint.method })
}

export const getUsers = cache(async (queryParams?: string): Promise<GetUsersResponse> => {
  const endpoint = apiRegistry.getUsers
  const url = queryParams ? `${endpoint.path}?${queryParams}` : endpoint.path
  return apiRequest<GetUsersResponse>(url, { method: endpoint.method })
})

export const getUser = cache(async (userId: string): Promise<User> => {
  const endpoint = apiRegistry.getUser
  return apiRequest<User>(buildPath(endpoint.path, { userId }), { method: endpoint.method })
})

export const deleteUser = cache(async (userId: string): Promise<void> => {
  const endpoint = apiRegistry.deleteUser
  return apiRequest<void>(buildPath(endpoint.path, { userId }), {
    method: endpoint.method
  })
})

/**
 * Upload a cover image file for a library item
 * Returns: { success: true, cover: coverPath }
 */
export async function uploadCover(libraryItemId: string, file: File): Promise<UploadCoverResponse> {
  const formData = new FormData()
  formData.append('cover', file, file.name)

  const endpoint = apiRegistry.uploadCover
  return apiRequest<UploadCoverResponse>(buildPath(endpoint.path, { libraryItemId }), {
    method: endpoint.method,
    body: formData
  })
}

/**
 * Remove the current cover from a library item
 * Returns: 200 status with no body
 */
export async function removeCover(libraryItemId: string): Promise<void> {
  const endpoint = apiRegistry.removeCover
  return apiRequest<void>(buildPath(endpoint.path, { libraryItemId }), {
    method: endpoint.method
  })
}

/**
 * Delete a library file from a library item
 * Returns: 200 status with no body
 */
export async function deleteLibraryFile(libraryItemId: string, fileIno: string): Promise<void> {
  const endpoint = apiRegistry.deleteLibraryFile
  return apiRequest<void>(buildPath(endpoint.path, { libraryItemId, fileIno }), {
    method: endpoint.method
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

  const endpoint = apiRegistry.uploadCover
  const payload: UpdateCoverFromUrlPayload = { url: coverUrl }
  return apiRequest<UploadCoverResponse>(buildPath(endpoint.path, { libraryItemId }), {
    method: endpoint.method,
    body: JSON.stringify(payload)
  })
}

/**
 * Set cover from a local file in the library
 * Returns: { success: true, cover: coverPath }
 */
export async function setCoverFromLocalFile(libraryItemId: string, filePath: string): Promise<UploadCoverResponse> {
  const endpoint = apiRegistry.setCoverFromLocalFile
  const payload: SetCoverFromLocalFilePayload = { cover: filePath }
  return apiRequest<UploadCoverResponse>(buildPath(endpoint.path, { libraryItemId }), {
    method: endpoint.method,
    body: JSON.stringify(payload)
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

  const endpoint = apiRegistry.searchLibrary
  const basePath = buildPath(endpoint.path, { libraryId })
  return apiRequest<SearchLibraryResponse>(`${basePath}?${params.toString()}`, { method: endpoint.method })
}

//
// Search Provider endpoints
//

/**
 * Get all available metadata search providers
 * Returns: Object with providers for books, book covers, and podcasts
 */
export const getMetadataProviders = cache(async (): Promise<MetadataProvidersResponse> => {
  const endpoint = apiRegistry.getMetadataProviders
  return apiRequest<MetadataProvidersResponse>(endpoint.path, { method: endpoint.method })
})

export const getTags = cache(async (): Promise<TagsResponse> => {
  const endpoint = apiRegistry.getTags
  return apiRequest<TagsResponse>(endpoint.path, { method: endpoint.method })
})

export const getGenres = cache(async (): Promise<GenresResponse> => {
  const endpoint = apiRegistry.getGenres
  return apiRequest<GenresResponse>(endpoint.path, { method: endpoint.method })
})

export const getNarrators = cache(async (libraryId: string) => {
  const endpoint = apiRegistry.getNarrators
  return apiRequest<GetNarratorsResponse>(buildPath(endpoint.path, { libraryId }), { method: endpoint.method })
})

export const getAuthor = cache(async (authorId: string, queryParams?: string): Promise<Author> => {
  const endpoint = apiRegistry.getAuthor
  const basePath = buildPath(endpoint.path, { authorId })
  const url = queryParams ? `${basePath}?${queryParams}` : basePath
  return apiRequest<Author>(url, { method: endpoint.method })
})

export const getPlaylist = cache(async (playlistId: string): Promise<Playlist> => {
  const endpoint = apiRegistry.getPlaylist
  return apiRequest<Playlist>(buildPath(endpoint.path, { playlistId }), { method: endpoint.method })
})

export const getCollection = cache(async (collectionId: string): Promise<Collection> => {
  const endpoint = apiRegistry.getCollection
  const basePath = buildPath(endpoint.path, { collectionId })
  return apiRequest<Collection>(`${basePath}?include=rssfeed`, { method: endpoint.method })
})

export const getSeries = cache(async (libraryId: string, seriesId: string): Promise<Series> => {
  const endpoint = apiRegistry.getSeries
  return apiRequest<Series>(buildPath(endpoint.path, { libraryId, seriesId }), { method: endpoint.method })
})

// Paginated entity list functions for bookshelf views
export const getLibrarySeries = cache(async (libraryId: string, queryParams?: string): Promise<GetSeriesResponse> => {
  const endpoint = apiRegistry.getSeriesList
  const basePath = buildPath(endpoint.path, { libraryId })
  const url = queryParams ? `${basePath}?${queryParams}` : basePath
  return apiRequest<GetSeriesResponse>(url, { method: endpoint.method })
})

export const getLibraryAuthors = cache(async (libraryId: string, queryParams?: string): Promise<GetAuthorsResponse> => {
  const endpoint = apiRegistry.getAuthorsList
  const basePath = buildPath(endpoint.path, { libraryId })
  const url = queryParams ? `${basePath}?${queryParams}` : basePath
  return apiRequest<GetAuthorsResponse>(url, { method: endpoint.method })
})

export const getLibraryCollections = cache(async (libraryId: string, queryParams?: string): Promise<GetCollectionsResponse> => {
  const endpoint = apiRegistry.getCollectionsList
  const basePath = buildPath(endpoint.path, { libraryId })
  const url = queryParams ? `${basePath}?${queryParams}` : basePath
  return apiRequest<GetCollectionsResponse>(url, { method: endpoint.method })
})

export const getLibraryPlaylists = cache(async (libraryId: string, queryParams?: string): Promise<GetPlaylistsResponse> => {
  const endpoint = apiRegistry.getPlaylistsList
  const basePath = buildPath(endpoint.path, { libraryId })
  const url = queryParams ? `${basePath}?${queryParams}` : basePath
  return apiRequest<GetPlaylistsResponse>(url, { method: endpoint.method })
})

export const getApiKeys = cache(async (): Promise<GetApiKeysResponse> => {
  const endpoint = apiRegistry.getApiKeys
  return apiRequest<GetApiKeysResponse>(endpoint.path, { method: endpoint.method })
})

export const deleteApiKey = cache(async (apiKeyId: string): Promise<void> => {
  const endpoint = apiRegistry.deleteApiKey
  return apiRequest<void>(buildPath(endpoint.path, { apiKeyId }), { method: endpoint.method })
})

export async function createApiKey(payload: CreateApiKeyPayload): Promise<CreateUpdateApiKeyResponse> {
  const endpoint = apiRegistry.createApiKey
  return apiRequest<CreateUpdateApiKeyResponse>(endpoint.path, {
    method: endpoint.method,
    body: JSON.stringify(payload)
  })
}

export async function updateApiKey(apiKeyId: string, payload: CreateApiKeyPayload): Promise<CreateUpdateApiKeyResponse> {
  const endpoint = apiRegistry.updateApiKey
  return apiRequest<CreateUpdateApiKeyResponse>(buildPath(endpoint.path, { apiKeyId }), {
    method: endpoint.method,
    body: JSON.stringify(payload)
  })
}

export const getRssFeeds = cache(async (): Promise<GetRssFeedsResponse> => {
  const endpoint = apiRegistry.getRssFeeds
  return apiRequest<GetRssFeedsResponse>(endpoint.path, { method: endpoint.method })
})

export const closeRssFeed = cache(async (feedId: string): Promise<void> => {
  const endpoint = apiRegistry.closeRssFeed
  return apiRequest<void>(buildPath(endpoint.path, { feedId }), { method: endpoint.method })
})

export const getBackups = cache(async (): Promise<GetBackupsResponse> => {
  const endpoint = apiRegistry.getBackups
  return apiRequest<GetBackupsResponse>(endpoint.path, { method: endpoint.method })
})

export const getLoggerData = cache(async (): Promise<GetLoggerDataResponse> => {
  const endpoint = apiRegistry.getLoggerData
  return apiRequest<GetLoggerDataResponse>(endpoint.path, { method: endpoint.method })
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

  const endpoint = apiRegistry.searchBooks
  return apiRequest<BookSearchResult[]>(`${endpoint.path}?${params.toString()}`, { method: endpoint.method })
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

  const endpoint = apiRegistry.searchPodcasts
  return apiRequest<PodcastSearchResult[]>(`${endpoint.path}?${params.toString()}`, { method: endpoint.method })
}

/**
 * Update library item media (metadata, tags, cover)
 * @param libraryItemId - Library item ID
 * @param updatePayload - Update payload with metadata, tags, and optionally url for cover
 * Returns: { updated: boolean, libraryItem?: LibraryItem }
 */
export async function updateLibraryItemMedia(libraryItemId: string, updatePayload: UpdateLibraryItemMediaPayload): Promise<UpdateLibraryItemMediaResponse> {
  const endpoint = apiRegistry.updateLibraryItemMedia
  return apiRequest<UpdateLibraryItemMediaResponse>(buildPath(endpoint.path, { libraryItemId }), {
    method: endpoint.method,
    body: JSON.stringify(updatePayload)
  })
}

/**
 * Update media finished state for a library item (and optional episode)
 */
export async function updateMediaFinished(libraryItemId: string, payload: { isFinished: boolean; episodeId?: string }): Promise<void> {
  const endpoint = payload.episodeId ? apiRegistry.updateMediaFinishedEpisode : apiRegistry.updateMediaFinished
  const path = payload.episodeId
    ? buildPath(endpoint.path, { libraryItemId, episodeId: payload.episodeId })
    : buildPath(endpoint.path, { libraryItemId })
  const body: UpdateMediaFinishedPayload = { isFinished: payload.isFinished }

  return apiRequest<void>(path, {
    method: endpoint.method,
    body: JSON.stringify(body)
  })
}

/**
 * Trigger a rescan for a library item
 */
export async function rescanLibraryItem(libraryItemId: string): Promise<RescanLibraryItemResponse> {
  const endpoint = apiRegistry.rescanLibraryItem
  return apiRequest<RescanLibraryItemResponse>(buildPath(endpoint.path, { libraryItemId }), { method: endpoint.method })
}

/**
 * Send an ebook to a configured e-reader device
 */
export async function sendEbookToDevice(payload: SendEbookToDevicePayload): Promise<void> {
  const endpoint = apiRegistry.sendEbookToDevice
  return apiRequest<void>(endpoint.path, {
    method: endpoint.method,
    body: JSON.stringify(payload)
  })
}

/**
 * Remove a series from the "continue listening" shelf
 */
export async function removeSeriesFromContinueListening(seriesId: string): Promise<void> {
  const endpoint = apiRegistry.removeSeriesFromContinueListening
  return apiRequest<void>(buildPath(endpoint.path, { seriesId }), { method: endpoint.method })
}

/**
 * Remove a single progress entry from the continue listening/reading shelf
 */
export async function removeFromContinueListening(progressId: string): Promise<void> {
  const endpoint = apiRegistry.removeFromContinueListening
  return apiRequest<void>(buildPath(endpoint.path, { progressId }), { method: endpoint.method })
}

/**
 * Delete a library item, optionally deleting from the file system (hard delete)
 */
export async function deleteLibraryItem(libraryItemId: string, hardDelete: boolean): Promise<void> {
  const hard = hardDelete ? '1' : '0'
  const endpoint = apiRegistry.deleteLibraryItem
  const basePath = buildPath(endpoint.path, { libraryItemId })
  return apiRequest<void>(`${basePath}?hard=${hard}`, { method: endpoint.method })
}

/**
 * Quick embed metadata into audio files for a library item
 * @param libraryItemId - Library item ID
 * Returns: void (success) or throws error
 */
export async function embedMetadataQuick(libraryItemId: string): Promise<void> {
  const endpoint = apiRegistry.embedMetadataQuick
  return apiRequest<void>(buildPath(endpoint.path, { libraryItemId }), { method: endpoint.method })
}

/**
 * Get all tasks with optional queue data
 * Returns: Tasks array and queued task data
 */
export async function getTasks(): Promise<TasksResponse> {
  const endpoint = apiRegistry.getTasks
  const params = new URLSearchParams({ include: 'queue' })
  return apiRequest<TasksResponse>(`${endpoint.path}?${params.toString()}`, { method: endpoint.method })
}

//
// Library Action endpoints
//

/**
 * Create a library
 * @param newLibrary - New library object
 * Returns: Library object
 */
export async function createLibrary(newLibrary: Library): Promise<Library> {
  const endpoint = apiRegistry.createLibrary
  return apiRequest<Library>(endpoint.path, {
    method: endpoint.method,
    body: JSON.stringify(newLibrary)
  })
}

/**
 * Update a library
 * @param libraryId - Library ID
 * @param newLibrary - New library object
 * Returns: Library object
 */
export async function updateLibrary(libraryId: string, updatedLibrary: Library): Promise<Library> {
  const endpoint = apiRegistry.updateLibrary
  return apiRequest<Library>(buildPath(endpoint.path, { libraryId }), {
    method: endpoint.method,
    body: JSON.stringify(updatedLibrary)
  })
}

/**
 * Delete a library
 * @param libraryId - Library ID
 * @param newLibrary - New library object
 * Returns: Library object
 */
export async function deleteLibrary(libraryId: string): Promise<Library> {
  const endpoint = apiRegistry.deleteLibrary
  return apiRequest<Library>(buildPath(endpoint.path, { libraryId }), { method: endpoint.method })
}

/**
 * Scan a library
 * @param libraryItemId - Library item ID
 * @param force - force a scan
 * Returns: void (success) or throws error
 */
export async function scanLibrary(libraryId: string, force: boolean = false): Promise<void> {
  const endpoint = apiRegistry.scanLibrary
  const basePath = buildPath(endpoint.path, { libraryId })
  const params = new URLSearchParams({ force: force ? '1' : '0' })
  return apiRequest<void>(`${basePath}?${params.toString()}`, { method: endpoint.method })
}

/**
 * Save the order of libraries
 * @param libraryItemId - Library item ID
 * Returns: void (success) or throws error TODO
 */
export async function saveLibraryOrder(reorderObjects: SaveLibraryOrderPayload): Promise<SaveLibraryOrderApiResponse> {
  const endpoint = apiRegistry.saveLibraryOrder
  return apiRequest<SaveLibraryOrderApiResponse>(endpoint.path, {
    method: endpoint.method,
    body: JSON.stringify(reorderObjects)
  })
}

/**
 * Match all books in a library
 * @param libraryId - Library item ID
 * Returns: void (success) or throws error
 */
export async function matchAll(libraryId: string): Promise<void> {
  const endpoint = apiRegistry.matchAll
  return apiRequest<void>(buildPath(endpoint.path, { libraryId }), { method: endpoint.method })
}

//
// Collection endpoints
//

/**
 * Update a collection
 * @param collectionId - Collection ID
 * @param payload - Update payload with name and/or description
 * Returns: Updated collection
 */
export async function updateCollection(collectionId: string, payload: UpdateCollectionPayload): Promise<Collection> {
  const endpoint = apiRegistry.updateCollection
  return apiRequest<Collection>(buildPath(endpoint.path, { collectionId }), {
    method: endpoint.method,
    body: JSON.stringify(payload)
  })
}

/**
 * Delete a collection
 * @param collectionId - Collection ID
 * Returns: void (success) or throws error
 */
export async function deleteCollection(collectionId: string): Promise<void> {
  const endpoint = apiRegistry.deleteCollection
  return apiRequest<void>(buildPath(endpoint.path, { collectionId }), { method: endpoint.method })
}

/**
 * Create a playlist from a collection
 * @param collectionId - Collection ID to create playlist from
 * Returns: The created playlist with id
 */
export async function createPlaylistFromCollection(collectionId: string): Promise<CreatePlaylistFromCollectionResponse> {
  const endpoint = apiRegistry.createPlaylistFromCollection
  return apiRequest<CreatePlaylistFromCollectionResponse>(buildPath(endpoint.path, { collectionId }), { method: endpoint.method })
}

/**
 * Delete a playlist
 * @param playlistId - Playlist ID to delete
 * Returns: void (success) or throws error
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
  const endpoint = apiRegistry.deletePlaylist
  return apiRequest<void>(buildPath(endpoint.path, { playlistId }), { method: endpoint.method })
}

//
// Author endpoints
//

/**
 * Match an author by ID
 * @param authorId - Author ID to match
 * @param payload - Quick match payload with provider and optional search data
 * Returns: Updated author response
 */
export async function quickMatchAuthor(authorId: string, payload: AuthorQuickMatchPayload): Promise<AuthorUpdateResponse> {
  const endpoint = apiRegistry.quickMatchAuthor
  return apiRequest<AuthorUpdateResponse>(buildPath(endpoint.path, { authorId }), {
    method: endpoint.method,
    body: JSON.stringify(payload)
  })
}

/**
 * Update an author
 * @param authorId - Author ID
 * @param payload - Update payload with author data
 * Returns: Updated author response
 */
export async function updateAuthor(authorId: string, payload: UpdateAuthorPayload): Promise<AuthorUpdateResponse> {
  const endpoint = apiRegistry.updateAuthor
  return apiRequest<AuthorUpdateResponse>(buildPath(endpoint.path, { authorId }), {
    method: endpoint.method,
    body: JSON.stringify(payload)
  })
}

/**
 * Delete an author
 * @param authorId - Author ID to delete
 * Returns: void (success) or throws error
 */
export async function deleteAuthor(authorId: string): Promise<void> {
  const endpoint = apiRegistry.deleteAuthor
  return apiRequest<void>(buildPath(endpoint.path, { authorId }), { method: endpoint.method })
}

/**
 * Get filesystem directories for folder browsing
 * Used by the folder chooser when creating/editing libraries
 * @param path - Directory path to list (empty string for root)
 * @param level - Depth level for the listing
 * Returns: { directories: Array<{ path, dirname, level }>, posix: boolean }
 */
export async function getFilesystemPaths(path: string, level: number): Promise<GetFilesystemPathsResponse> {
  const endpoint = apiRegistry.getFilesystemPaths
  const params = new URLSearchParams({ path, level: level.toString() })
  return apiRequest<GetFilesystemPathsResponse>(`${endpoint.path}?${params.toString()}`, { method: endpoint.method })
}

/**
 * Upload a cover image file for an author
 * Returns: @AuthorResponse
 */
export async function submitAuthorImage(authorId: string, payload: AuthorImagePayload): Promise<AuthorResponse> {
  const endpoint = apiRegistry.submitAuthorImage
  return apiRequest<AuthorResponse>(buildPath(endpoint.path, { authorId }), {
    method: endpoint.method,
    body: JSON.stringify(payload)
  })
}

/**
 * Remove the current cover image from an author
 * Returns: @AuthorResponse
 */
export async function removeAuthorImage(authorId: string): Promise<AuthorResponse> {
  const endpoint = apiRegistry.removeAuthorImage
  return apiRequest<AuthorResponse>(buildPath(endpoint.path, { authorId }), { method: endpoint.method })
}
