'use server'

import { getAudioFileFFProbeData } from '@/lib/api'
import { FFProbeData } from '@/types/api'

/**
 * Server action to get FFProbe data for an audio file
 * @param itemId - Library item ID
 * @param fileIno - Audio file inode
 */
export async function getAudioFileFFProbeDataAction(itemId: string, fileIno: string): Promise<FFProbeData> {
  return getAudioFileFFProbeData(itemId, fileIno)
}
