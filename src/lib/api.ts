import { cookies, headers } from 'next/headers'
import { cache } from 'react'

interface ApiResponse<T = any> {
  data?: T
  error?: string
}

async function getServerBaseUrl() {
  let host = process.env.HOST || 'localhost'
  if (host === '0.0.0.0') {
    // Convert "all interfaces" address to localhost for internal API calls
    host = 'localhost'
  }
  return `http://${host}:${process.env.PORT || '3333'}`
}

/**
 * Make an authenticated API request to the server
 */
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const cookieStore = await cookies()
    if (!cookieStore.get('connect.sid')) {
      return { error: 'Unauthorized' }
    }

    const authToken = cookieStore.get('auth_token')?.value
    if (!authToken) {
      return { error: 'No authentication token found' }
    }

    const baseUrl = await getServerBaseUrl()
    const url = `${baseUrl}${endpoint}`
    console.log('Making API request to:', url)
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { error: 'Unauthorized' }
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
 * Get user data from the authorize endpoint
 */
export const getCurrentUser = cache(async () => {
  return apiRequest('/api/authorize', {
    method: 'POST'
  })
})

/**
 * Get server status
 */
export async function getServerStatus() {
  return apiRequest('/status')
}

export async function getLibraries() {
  return apiRequest('/api/libraries')
}

export async function getLibrary(libraryId: string) {
  return apiRequest(`/api/libraries/${libraryId}`)
}

export async function getLibraryPersonalized(libraryId: string) {
  return apiRequest(`/api/libraries/${libraryId}/personalized`)
}
