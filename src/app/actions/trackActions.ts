'use server'

import * as api from '@/lib/api'
import type { OrderedTrackFileData } from '@/types/api'

export async function updateTracksAction(libraryItemId: string, orderedFileData: OrderedTrackFileData[]) {
  return api.updateTracks(libraryItemId, orderedFileData)
}
