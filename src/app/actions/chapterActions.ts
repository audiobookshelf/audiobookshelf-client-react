'use server'

import * as api from '@/lib/api'
import type { Chapter } from '@/types/api'

export async function updateChaptersAction(libraryItemId: string, chapters: Chapter[]) {
  return api.updateChapters(libraryItemId, chapters)
}

export async function searchChaptersAction(asin: string, region: string) {
  return api.searchChapters(asin, region)
}
