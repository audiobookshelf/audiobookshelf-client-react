'use server'

import { deleteLibraryFile, getAudioFileFFProbeData } from '@/lib/api'
import { FFProbeData } from '@/types/api'

/**
 * Server action to get FFProbe data for an audio file
 * @param itemId - Library item ID
 * @param fileIno - Audio file inode
 */
export async function getAudioFileFFProbeDataAction(itemId: string, fileIno: string): Promise<FFProbeData> {
  return getAudioFileFFProbeData(itemId, fileIno)
}

/**
 * Server action to delete a library file
 * @param itemId - Library item ID
 * @param fileIno - File inode
 */
export async function deleteLibraryFileAction(itemId: string, fileIno: string): Promise<void> {
  return deleteLibraryFile(itemId, fileIno)
}
