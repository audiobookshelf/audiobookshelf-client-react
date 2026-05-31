'use server'

import * as api from '@/lib/api'
import { FetchPodcastFeedResponse, GetPodcastTitlesResponse, ParseOpmlFeedsResponse, PodcastSearchResult } from '@/types/api'

export async function searchPodcastsForLibraryAction(term: string, country: string): Promise<PodcastSearchResult[]> {
  return api.searchPodcasts(term, country)
}

export async function fetchPodcastFeedAction(rssFeed: string): Promise<FetchPodcastFeedResponse> {
  return api.fetchPodcastFeed(rssFeed)
}

export async function getPodcastTitlesAction(libraryId: string): Promise<GetPodcastTitlesResponse> {
  return api.getPodcastTitles(libraryId)
}

export async function parseOpmlFeedsAction(opmlText: string): Promise<ParseOpmlFeedsResponse> {
  return api.parseOpmlFeeds(opmlText)
}
