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
  CreateApiKeyPayload,
  CreateCustomMetadataProviderPayload,
  CreateCustomMetadataProviderResponse,
  CreateUpdateApiKeyResponse,
  FetchPodcastFeedResponse,
  FFProbeData,
  GetApiKeysResponse,
  GetAuthorsResponse,
  GetBackupsResponse,
  GetCollectionsResponse,
  GetCustomMetadataProvidersResponse,
  GetFilesystemPathsResponse,
  GetLibrariesResponse,
  GetLibraryItemsResponse,
  GetListeningSessionsResponse,
  GetLoggerDataResponse,
  GetNarratorsResponse,
  GetOpenListeningSessionsResponse,
  GetPlaylistsResponse,
  GetRssFeedsResponse,
  GetSeriesResponse,
  GetUsersResponse,
  Library,
  LibraryFilterData,
  LibraryItem,
  MediaItemShare,
  MetadataProvidersResponse,
  MutateBackupsResponse,
  OpenMediaItemSharePayload,
  OpenRssFeedPayload,
  OpenRssFeedResponse,
  PersonalizedShelf,
  Playlist,
  PlaylistItemPayload,
  PodcastSearchResult,
  RssPodcastEpisode,
  SaveLibraryOrderApiResponse,
  SearchLibraryResponse,
  Series,
  ServerStatus,
  TasksResponse,
  UpdateAuthorPayload,
  UpdateLibraryItemMediaPayload,
  UpdateLibraryItemMediaResponse,
  UploadCoverResponse,
  User,
  UserLoginResponse
} from '../types/api'

import { ApiError, NetworkError, UnauthorizedError } from './apiErrors'

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
 * Client-facing origin from request headers (for redirects out of internal API routes).
 * The server may use an internal hostname; the browser must be sent to the URL it used.
 */
export function getClientBaseUrlFromRequest(request: Request): string {
  const headers = new Headers(request.headers)
  const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost'
  const protocol = headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')
  return `${protocol}://${host}`
}

/**
 * Send the browser to /login with an error hint and drop refresh cookie (session cannot continue).
 */
export function redirectToLogin(request: Request, errorMessage: string): NextResponse {
  const login = new URL('/login', getClientBaseUrlFromRequest(request))
  login.searchParams.set('error', errorMessage)
  const response = NextResponse.redirect(login)
  response.cookies.delete('refresh_token')
  return response
}

/**
 * User "Home" page is the default library page, or settings/account page if no libraries are set yet
 */
export function getUserDefaultUrlPath(userDefaultLibraryId: string | null, userType: string) {
  const isAdmin = ['admin', 'root'].includes(userType)
  return userDefaultLibraryId ? `/library/${userDefaultLibraryId}` : isAdmin ? '/settings' : '/account'
}

/**
 * Shared shape for `response.cookies` and `cookies()` from `next/headers` (both expose `.set`).
 * maxAgeSeconds is the env JWT lifetime; cookie maxAge is slightly shorter so the cookie expires
 * before the token is rejected (5 second buffer).
 */
function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.max(maxAgeSeconds - 5, 5)
  }
}

type SessionCookieSetter = {
  set(name: string, value: string, options: ReturnType<typeof sessionCookieOptions>): void
}

function writeSessionCookies(store: SessionCookieSetter, accessToken: string, refreshToken: string | null) {
  store.set('access_token', accessToken, sessionCookieOptions(AccessTokenExpiry))
  if (refreshToken) {
    store.set('refresh_token', refreshToken, sessionCookieOptions(RefreshTokenExpiry))
  }
}

/**
 * The NextJS server sets its own cookies separate from the Audiobookshelf server
 * because the Abs Server cookies are not available to NextJS for server-side rendering.
 */
export function setTokenCookies(response: NextResponse, accessToken: string, refreshToken: string | null) {
  writeSessionCookies(response.cookies, accessToken, refreshToken)
}

/** New tokens from POST /auth/refresh */
export type SessionRefreshTokens = {
  accessToken: string
  refreshToken: string | null
}

/** Full `/auth/refresh` payload used by internal-api/refresh for redirects. */
export type SessionRefreshResult = SessionRefreshTokens & {
  userDefaultLibraryId: string | null
  userType: string
}

/**
 * Exchange a refresh token for new session tokens (server-side).
 * Used by internal-api/refresh and download proxies that cannot rely on a redirect.
 */
export async function refreshSessionWithToken(refreshToken: string): Promise<SessionRefreshResult | null> {
  const baseUrl = getServerBaseUrl()
  const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-refresh-token': refreshToken
    }
  })

  if (!refreshResponse.ok) {
    return null
  }

  const data = (await refreshResponse.json()) as {
    userDefaultLibraryId?: string | null
    user?: { accessToken?: string; refreshToken?: string; type?: string }
  }

  const accessToken = data.user?.accessToken
  if (!accessToken) {
    return null
  }

  return {
    accessToken,
    refreshToken: data.user?.refreshToken ?? null,
    userDefaultLibraryId: data.userDefaultLibraryId ?? null,
    userType: data.user?.type ?? 'user'
  }
}

export async function getAccessToken() {
  return (await cookies()).get('access_token')?.value || null
}

async function redirectToSessionRefreshRoute() {
  const currentPath = (await headers()).get('x-current-path') ?? ''
  redirect(`/internal-api/refresh?redirect=${encodeURIComponent(currentPath || '')}`)
}

/**
 * Refresh via ABS, write Next.js cookies for this request (so server actions return Set-Cookie).
 * If cookies cannot be mutated (e.g. Server Component render), redirect to `/internal-api/refresh` like {@link getData}.
 */
async function applyRefreshedSessionOrRedirect(cookieStore: Awaited<ReturnType<typeof cookies>>, refreshToken: string): Promise<SessionRefreshTokens> {
  const session = await refreshSessionWithToken(refreshToken)
  if (!session) {
    throw new UnauthorizedError('Unauthorized')
  }
  try {
    writeSessionCookies(cookieStore, session.accessToken, session.refreshToken)
  } catch {
    await redirectToSessionRefreshRoute()
  }
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken
  }
}

async function parseApiResponseBody<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')
  const contentLength = response.headers.get('content-length')

  if (response.status === 204 || contentLength === '0') {
    return undefined as T
  }

  if (contentType?.includes('application/json')) {
    const data = await response.json()
    return data as T
  }

  const text = await response.text()
  if (!text || text.trim() === '') {
    return undefined as T
  }

  try {
    const data = JSON.parse(text)
    return data as T
  } catch {
    return undefined as T
  }
}

/**
 * Make an authenticated API request to the server
 * Throws UnauthorizedError, ApiError, or NetworkError on failure
 *
 * On 401 (or missing access token with a refresh cookie), exchanges the refresh token for new
 * session tokens, updates Next.js cookies when possible, and retries once. Server actions return updated cookies to the browser.
 */
export async function apiRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const isPublic = publicEndpoints.includes(endpoint)
    const cookieStore = await cookies()
    const baseUrl = getServerBaseUrl()
    const url = `${baseUrl}${endpoint}`

    const isFormData = options.body instanceof FormData

    const fetchHeaders = new Headers(options.headers as Record<string, string>)

    if (!isFormData && !fetchHeaders.has('Content-Type')) {
      fetchHeaders.set('Content-Type', 'application/json')
    }

    let accessToken: string | null = null
    let refreshToken: string | null = null
    let didProactiveRefresh = false

    if (!isPublic) {
      accessToken = cookieStore.get('access_token')?.value ?? null
      refreshToken = cookieStore.get('refresh_token')?.value ?? null

      if (!accessToken && refreshToken) {
        const session = await applyRefreshedSessionOrRedirect(cookieStore, refreshToken)
        accessToken = session.accessToken
        refreshToken = session.refreshToken ?? cookieStore.get('refresh_token')?.value ?? null
        didProactiveRefresh = true
      }

      if (!accessToken) {
        throw new UnauthorizedError('No authentication token found')
      }

      fetchHeaders.set('Authorization', `Bearer ${accessToken}`)
    }

    let response = await fetch(url, {
      ...options,
      headers: fetchHeaders
    })

    if (!isPublic && response.status === 401 && refreshToken && !didProactiveRefresh) {
      const session = await applyRefreshedSessionOrRedirect(cookieStore, refreshToken)
      fetchHeaders.set('Authorization', `Bearer ${session.accessToken}`)
      response = await fetch(url, {
        ...options,
        headers: fetchHeaders
      })
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new UnauthorizedError('Unauthorized')
      }

      const errorMessage = await response.text()
      throw new ApiError(errorMessage || `HTTP ${response.status}: ${response.statusText}`, response.status, response.statusText)
    }

    return parseApiResponseBody<T>(response)
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
      throw error
    }
    if (error instanceof UnauthorizedError || error instanceof ApiError) {
      throw error
    }
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
  return apiRequest<PersonalizedShelf[]>(`/api/libraries/${libraryId}/personalized?include=rssfeed,share`, {})
})

export const getLibraryItems = cache(async (libraryId: string, queryParams?: string): Promise<GetLibraryItemsResponse> => {
  return apiRequest<GetLibraryItemsResponse>(`/api/libraries/${libraryId}/items${queryParams ? `?${queryParams}` : ''}`, {})
})

/**
 * Get filter data for a library (genres, tags, authors, series, etc.)
 * Used for populating filter dropdown menus
 */
export async function getLibraryFilterData(libraryId: string): Promise<LibraryFilterData> {
  return apiRequest<LibraryFilterData>(`/api/libraries/${libraryId}/filterdata`, {})
}

/**
 * Get a single library item by ID.
 * @param itemId - Library item ID
 * @param expanded - If true, returns expanded item with full media/chapters etc.
 * @param include - Optional comma-separated includes: rssfeed, share, downloads
 */
export const getLibraryItem = cache(async (itemId: string, expanded?: boolean, include?: string): Promise<LibraryItem> => {
  const params = new URLSearchParams()
  params.set('expanded', expanded ? '1' : '0')
  if (include) params.set('include', include)
  return apiRequest<LibraryItem>(`/api/items/${itemId}?${params.toString()}`, {})
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

export const getUsers = cache(async (queryParams?: string): Promise<GetUsersResponse> => {
  return apiRequest<GetUsersResponse>(`/api/users${queryParams ? `?${queryParams}` : ''}`, {})
})

export const getUser = cache(async (userId: string): Promise<User> => {
  return apiRequest<User>(`/api/users/${userId}`, {})
})

export const deleteUser = cache(async (userId: string): Promise<void> => {
  return apiRequest<void>(`/api/users/${userId}`, {
    method: 'DELETE'
  })
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

export const getAuthor = cache(async (authorId: string, queryParams?: string): Promise<Author> => {
  return apiRequest<Author>(`/api/authors/${authorId}${queryParams ? `?${queryParams}` : ''}`, {})
})

export const getPlaylist = cache(async (playlistId: string): Promise<Playlist> => {
  return apiRequest<Playlist>(`/api/playlists/${playlistId}`, {})
})

export const getCollection = cache(async (collectionId: string): Promise<Collection> => {
  return apiRequest<Collection>(`/api/collections/${collectionId}?include=rssfeed`, {})
})

export const getSeries = cache(async (libraryId: string, seriesId: string): Promise<Series> => {
  return apiRequest<Series>(`/api/libraries/${libraryId}/series/${seriesId}?include=rssfeed`, {})
})

// Paginated entity list functions for bookshelf views
export const getLibrarySeries = cache(async (libraryId: string, queryParams?: string): Promise<GetSeriesResponse> => {
  return apiRequest<GetSeriesResponse>(`/api/libraries/${libraryId}/series${queryParams ? `?${queryParams}` : ''}`, {})
})

export const getLibraryAuthors = cache(async (libraryId: string, queryParams?: string): Promise<GetAuthorsResponse> => {
  return apiRequest<GetAuthorsResponse>(`/api/libraries/${libraryId}/authors${queryParams ? `?${queryParams}` : ''}`, {})
})

export const getLibraryCollections = cache(async (libraryId: string, queryParams?: string): Promise<GetCollectionsResponse> => {
  return apiRequest<GetCollectionsResponse>(`/api/libraries/${libraryId}/collections${queryParams ? `?${queryParams}` : ''}`, {})
})

export const getLibraryPlaylists = cache(async (libraryId: string, queryParams?: string): Promise<GetPlaylistsResponse> => {
  return apiRequest<GetPlaylistsResponse>(`/api/libraries/${libraryId}/playlists${queryParams ? `?${queryParams}` : ''}`, {})
})

export const getApiKeys = cache(async (): Promise<GetApiKeysResponse> => {
  return apiRequest<GetApiKeysResponse>('/api/api-keys', {})
})

export const deleteApiKey = cache(async (apiKeyId: string): Promise<void> => {
  return apiRequest<void>(`/api/api-keys/${apiKeyId}`, {
    method: 'DELETE'
  })
})

export async function createApiKey(payload: CreateApiKeyPayload): Promise<CreateUpdateApiKeyResponse> {
  return apiRequest<CreateUpdateApiKeyResponse>('/api/api-keys', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateApiKey(apiKeyId: string, payload: CreateApiKeyPayload): Promise<CreateUpdateApiKeyResponse> {
  return apiRequest<CreateUpdateApiKeyResponse>(`/api/api-keys/${apiKeyId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export const getRssFeeds = cache(async (): Promise<GetRssFeedsResponse> => {
  return apiRequest<GetRssFeedsResponse>('/api/feeds', {})
})

export const getCustomMetadataProviders = cache(async (): Promise<GetCustomMetadataProvidersResponse> => {
  return apiRequest<GetCustomMetadataProvidersResponse>('/api/custom-metadata-providers', {})
})

export const deleteCustomMetadataProvider = cache(async (providerId: string): Promise<void> => {
  return apiRequest<void>(`/api/custom-metadata-providers/${providerId}`, {
    method: 'DELETE'
  })
})

export async function createCustomMetadataProvider(payload: CreateCustomMetadataProviderPayload): Promise<CreateCustomMetadataProviderResponse> {
  return apiRequest<CreateCustomMetadataProviderResponse>('/api/custom-metadata-providers', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export const closeRssFeed = cache(async (feedId: string): Promise<void> => {
  return apiRequest<void>(`/api/feeds/${feedId}/close`, {
    method: 'POST'
  })
})

/** open an rss feed for library item, series or collection */
export async function openEntityRssFeed(
  entityType: 'item' | 'collection' | 'series',
  entityId: string,
  payload: OpenRssFeedPayload
): Promise<OpenRssFeedResponse> {
  return apiRequest<OpenRssFeedResponse>(`/api/feeds/${entityType}/${entityId}/open`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function openMediaItemShare(payload: OpenMediaItemSharePayload): Promise<MediaItemShare> {
  return apiRequest<MediaItemShare>('/api/share/mediaitem', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function closeMediaItemShare(shareId: string): Promise<void> {
  return apiRequest<void>(`/api/share/mediaitem/${shareId}`, {
    method: 'DELETE'
  })
}

export const getBackups = cache(async (): Promise<GetBackupsResponse> => {
  return apiRequest<GetBackupsResponse>('/api/backups', {})
})

export async function createBackup(): Promise<MutateBackupsResponse> {
  return apiRequest<MutateBackupsResponse>('/api/backups', {
    method: 'POST'
  })
}

export async function deleteBackup(backupId: string): Promise<MutateBackupsResponse> {
  return apiRequest<MutateBackupsResponse>(`/api/backups/${backupId}`, {
    method: 'DELETE'
  })
}

export async function applyBackup(backupId: string): Promise<void> {
  await apiRequest<void>(`/api/backups/${backupId}/apply`, {
    method: 'GET'
  })
}

export const getListeningSessions = cache(async (queryParams?: string): Promise<GetListeningSessionsResponse> => {
  return apiRequest<GetListeningSessionsResponse>(`/api/sessions${queryParams ? `?${queryParams}` : ''}`, {})
})

export const getOpenListeningSessions = cache(async (): Promise<GetOpenListeningSessionsResponse> => {
  return apiRequest<GetOpenListeningSessionsResponse>('/api/sessions/open', {})
})

export async function deleteListeningSession(sessionId: string): Promise<void> {
  return apiRequest<void>(`/api/sessions/${sessionId}`, {
    method: 'DELETE'
  })
}

export async function closeListeningSession(sessionId: string): Promise<void> {
  return apiRequest<void>(`/api/session/${sessionId}/close`, {
    method: 'POST'
  })
}

export async function batchDeleteListeningSessions(sessionIds: string[]): Promise<void> {
  return apiRequest<void>('/api/sessions/batch/delete', {
    method: 'POST',
    body: JSON.stringify({ sessions: sessionIds })
  })
}

export const getLoggerData = cache(async (): Promise<GetLoggerDataResponse> => {
  return apiRequest<GetLoggerDataResponse>('/api/logger-data', {})
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
 * Update media finished state for a library item (and optional episode)
 */
export async function updateMediaFinished(libraryItemId: string, payload: { isFinished: boolean; episodeId?: string }): Promise<void> {
  let endpoint = `/api/me/progress/${libraryItemId}`
  if (payload.episodeId) {
    endpoint += `/${payload.episodeId}`
  }

  return apiRequest<void>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({ isFinished: payload.isFinished })
  })
}

/**
 * Batch update media finished state for multiple items or episodes
 */
export async function batchUpdateMediaFinished(payload: { libraryItemId: string; episodeId?: string; isFinished: boolean }[]): Promise<void> {
  return apiRequest<void>('/api/me/progress/batch/update', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

/**
 * Trigger a rescan for a library item
 */
export async function rescanLibraryItem(libraryItemId: string): Promise<{ result: 'UPDATED' | 'UPTODATE' | 'REMOVED' | null }> {
  return apiRequest<{ result: 'UPDATED' | 'UPTODATE' | 'REMOVED' | null }>(`/api/items/${libraryItemId}/scan`, {
    method: 'POST'
  })
}

/**
 * Send an ebook to a configured e-reader device
 */
export async function sendEbookToDevice(payload: { libraryItemId: string; deviceName: string }): Promise<void> {
  return apiRequest<void>('/api/emails/send-ebook-to-device', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

/**
 * Remove a series from the "continue listening" shelf
 */
export async function removeSeriesFromContinueListening(seriesId: string): Promise<void> {
  return apiRequest<void>(`/api/me/series/${seriesId}/remove-from-continue-listening`, {
    method: 'GET'
  })
}

/**
 * Remove a single progress entry from the continue listening/reading shelf
 */
export async function removeFromContinueListening(progressId: string): Promise<void> {
  return apiRequest<void>(`/api/me/progress/${progressId}/remove-from-continue-listening`, {
    method: 'GET'
  })
}

/**
 * Delete a library item, optionally deleting from the file system (hard delete)
 */
export async function deleteLibraryItem(libraryItemId: string, hardDelete: boolean): Promise<void> {
  const hard = hardDelete ? '1' : '0'
  return apiRequest<void>(`/api/items/${libraryItemId}?hard=${hard}`, {
    method: 'DELETE'
  })
}

/**
 * Delete an episode from a podcast library item.
 * @param hardDelete - If true, also deletes the audio file from the file system
 */
export async function deleteLibraryItemMediaEpisode(libraryItemId: string, episodeId: string, hardDelete = false): Promise<void> {
  const hard = hardDelete ? '?hard=1' : ''
  return apiRequest<void>(`/api/podcasts/${libraryItemId}/episode/${episodeId}${hard}`, {
    method: 'DELETE'
  })
}

/**
 * Fetch podcast feed using an RSS URL
 * @param rssFeed - RSS Feed URL
 */
export async function fetchPodcastFeed(rssFeed: string): Promise<FetchPodcastFeedResponse> {
  return apiRequest<FetchPodcastFeedResponse>(`/api/podcasts/feed`, {
    method: 'POST',
    body: JSON.stringify({ rssFeed })
  })
}

/**
 * Download selected podcast episodes
 * @param libraryItemId - Library item ID
 * @param episodes - Array of episodes to download
 */
export async function downloadPodcastEpisodes(libraryItemId: string, episodes: RssPodcastEpisode[]): Promise<void> {
  return apiRequest<void>(`/api/podcasts/${libraryItemId}/download-episodes`, {
    method: 'POST',
    body: JSON.stringify(episodes)
  })
}

/**
 * Clear queued podcast episode downloads for a library item.
 * @param libraryItemId - Library item ID
 */
export async function clearPodcastDownloadQueue(libraryItemId: string): Promise<void> {
  return apiRequest<void>(`/api/podcasts/${libraryItemId}/clear-queue`, {
    method: 'GET'
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

//
// Library Action endpoints
//

/**
 * Create a library
 * @param newLibrary - New library object
 * Returns: Library object
 */
export async function createLibrary(newLibrary: Library): Promise<Library> {
  return apiRequest<Library>(`/api/libraries/`, {
    method: 'POST',
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
  return apiRequest<Library>(`/api/libraries/${libraryId}`, {
    method: 'PATCH',
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
  return apiRequest<Library>(`/api/libraries/${libraryId}`, {
    method: 'DELETE'
  })
}

/**
 * Scan a library
 * @param libraryItemId - Library item ID
 * @param force - force a scan
 * Returns: void (success) or throws error
 */
export async function scanLibrary(libraryId: string, force: boolean = false): Promise<void> {
  return apiRequest<void>(`/api/libraries/${libraryId}/scan?force=${force ? 1 : 0}`, {
    method: 'POST'
  })
}

/**
 * Save the order of libraries
 * @param libraryItemId - Library item ID
 * Returns: void (success) or throws error TODO
 */
export async function saveLibraryOrder(reorderObjects: { id: string; newOrder: number }[]): Promise<SaveLibraryOrderApiResponse> {
  return apiRequest<SaveLibraryOrderApiResponse>('/api/libraries/order', {
    method: 'POST',
    body: JSON.stringify(reorderObjects)
  })
}

/**
 * Match all books in a library
 * @param libraryId - Library item ID
 * Returns: void (success) or throws error
 */
export async function matchAll(libraryId: string): Promise<void> {
  return apiRequest<void>(`/api/libraries/${libraryId}/matchall`, {
    method: 'GET'
  })
}

//
// Collection endpoints
//

/**
 * Create a collection w/ initial book library item IDs
 */
export async function createCollection(payload: { libraryId: string; name: string; description?: string | null; books?: string[] }): Promise<Collection> {
  return apiRequest<Collection>('/api/collections', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

/**
 * Add a book library item to a collection
 */
export async function addBookToCollection(collectionId: string, libraryItemId: string): Promise<Collection> {
  return apiRequest<Collection>(`/api/collections/${collectionId}/book`, {
    method: 'POST',
    body: JSON.stringify({ id: libraryItemId })
  })
}

/**
 * Remove a book library item from a collection
 */
export async function removeBookFromCollection(collectionId: string, libraryItemId: string): Promise<Collection> {
  return apiRequest<Collection>(`/api/collections/${collectionId}/book/${libraryItemId}`, {
    method: 'DELETE'
  })
}

/**
 * Update a collection
 * @param collectionId - Collection ID
 * @param payload - Update payload with name and/or description
 * Returns: Updated collection
 */
export async function updateCollection(
  collectionId: string,
  payload: { name?: string; description?: string | null; books?: string[] }
): Promise<Collection> {
  return apiRequest<Collection>(`/api/collections/${collectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

/**
 * Delete a collection
 * @param collectionId - Collection ID
 * Returns: void (success) or throws error
 */
export async function deleteCollection(collectionId: string): Promise<void> {
  return apiRequest<void>(`/api/collections/${collectionId}`, {
    method: 'DELETE'
  })
}

/**
 * Create a playlist from a collection
 * @param collectionId - Collection ID to create playlist from
 * Returns: The created playlist with id
 */
export async function createPlaylistFromCollection(collectionId: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/api/playlists/collection/${collectionId}`, {
    method: 'POST'
  })
}

/**
 * Delete a playlist
 * @param playlistId - Playlist ID to delete
 * Returns: void (success) or throws error
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
  return apiRequest<void>(`/api/playlists/${playlistId}`, {
    method: 'DELETE'
  })
}

/**
 * Create a playlist w/ initial items
 */
export async function createPlaylist(payload: {
  libraryId: string
  name: string
  description?: string | null
  items?: PlaylistItemPayload[]
}): Promise<Playlist> {
  return apiRequest<Playlist>('/api/playlists', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

/**
 * Batch add items to a playlist
 */
export async function batchAddToPlaylist(playlistId: string, items: PlaylistItemPayload[]): Promise<Playlist> {
  return apiRequest<Playlist>(`/api/playlists/${playlistId}/batch/add`, {
    method: 'POST',
    body: JSON.stringify({ items })
  })
}

/**
 * Batch remove items from a playlist
 */
export async function batchRemoveFromPlaylist(playlistId: string, items: PlaylistItemPayload[]): Promise<Playlist> {
  return apiRequest<Playlist>(`/api/playlists/${playlistId}/batch/remove`, {
    method: 'POST',
    body: JSON.stringify({ items })
  })
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
  return apiRequest<AuthorUpdateResponse>(`/api/authors/${authorId}/match`, {
    method: 'POST',
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
  return apiRequest<AuthorUpdateResponse>(`/api/authors/${authorId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

/**
 * Delete an author
 * @param authorId - Author ID to delete
 * Returns: void (success) or throws error
 */
export async function deleteAuthor(authorId: string): Promise<void> {
  return apiRequest<void>(`/api/authors/${authorId}`, {
    method: 'DELETE'
  })
}

/**
 * Get filesystem directories for folder browsing
 * Used by the folder chooser when creating/editing libraries
 * @param path - Directory path to list (empty string for root)
 * @param level - Depth level for the listing
 * Returns: { directories: Array<{ path, dirname, level }>, posix: boolean }
 */
export async function getFilesystemPaths(path: string, level: number): Promise<GetFilesystemPathsResponse> {
  return apiRequest(`/api/filesystem?path=${encodeURIComponent(path)}&level=${level}`)
}

/**
 * Upload a cover image file for an author
 * Returns: @AuthorResponse
 */
export async function submitAuthorImage(authorId: string, payload: AuthorImagePayload): Promise<AuthorResponse> {
  return apiRequest<AuthorResponse>(`/api/authors/${authorId}/image`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

/**
 * Remove the current cover image from an author
 * Returns: @AuthorResponse
 */
export async function removeAuthorImage(authorId: string): Promise<AuthorResponse> {
  return apiRequest<AuthorResponse>(`/api/authors/${authorId}/image`, {
    method: 'DELETE'
  })
}
