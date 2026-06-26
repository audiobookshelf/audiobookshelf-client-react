'use server'

import * as api from '@/lib/api'
import { BookSearchResult, PodcastSearchResult } from '@/types/api'

export async function fetchBookMetadata(title: string, author: string, provider: string): Promise<BookSearchResult[]> {
  console.error('Fetching book metadata for:', { title, author, provider })
  return api.searchBooks(provider, title, author)
}

export async function fetchPodcastMetadata(title: string): Promise<PodcastSearchResult[]> {
  return api.searchPodcasts(title)
}
