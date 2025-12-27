'use server'

import * as api from '@/lib/api'
import { BookSearchResult, PodcastSearchResult } from '@/types/api'
import { cookies } from 'next/headers'

export async function fetchBookMetadata(title: string, author: string, provider: string): Promise<BookSearchResult[]> {
  console.error('Fetching book metadata for:', { title, author, provider })
  return api.searchBooks(provider, title, author)
}

export async function fetchPodcastMetadata(title: string): Promise<PodcastSearchResult[]> {
  return api.searchPodcasts(title)
}

export async function getCookie(): Promise<string> {
  // This is a workaround to get cookies in a server action because next cannot handle files or formdata in server actions (see uploadHelper.ts for upload imple)
  const cookieStore = await cookies()
  const auth = cookieStore.get('access_token')
  return auth?.value ?? ''
}
