import { cookies, headers } from 'next/headers'
import { cache } from 'react'

interface ApiResponse<T = any> {
  data?: T
  error?: string
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

const publicEndpoints = ['/status', '/init', '/login']

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
    let authToken: string | undefined

    if (!publicEndpoints.includes(endpoint)) {
      const cookieStore = await cookies()
      if (!cookieStore.get('connect.sid')) {
        return { error: 'Unauthorized' }
      }

      authToken = cookieStore.get('auth_token')?.value
      if (!authToken) {
        return { error: 'No authentication token found' }
      }
    }

    const baseUrl = await getServerBaseUrl()
    const url = `${baseUrl}${endpoint}`
    console.log('Making API request to:', url)

    const fetchHeaders: Record<string, any> = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (authToken) {
      fetchHeaders.Authorization = `Bearer ${authToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers: fetchHeaders
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
export const getServerStatus = cache(async (): Promise<ApiResponse<ServerStatus>> => {
  return apiRequest('/status')
})

export const getLibraries = cache(async () => {
  return apiRequest('/api/libraries')
})

export const getLibrary = cache(async (libraryId: string) => {
  return apiRequest(`/api/libraries/${libraryId}`)
})

export const getLibraryPersonalized = cache(async (libraryId: string) => {
  return apiRequest(`/api/libraries/${libraryId}/personalized`)
})
