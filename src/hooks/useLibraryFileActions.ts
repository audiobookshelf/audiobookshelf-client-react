import { AudioFile } from '@/types/api'
import { downloadLibraryItemFile } from '@/lib/download'
import { useCallback, useState } from 'react'

export function useLibraryFileActions(libraryItemId: string) {
  const [audioFileToShow, setAudioFileToShow] = useState<AudioFile | null>(null)

  const downloadFile = useCallback(
    (ino: string, filename: string) => {
      downloadLibraryItemFile(libraryItemId, ino, filename)
    },
    [libraryItemId]
  )

  const showMoreInfo = useCallback((audioFile: AudioFile) => {
    setAudioFileToShow(audioFile)
  }, [])

  const closeMoreInfo = useCallback(() => {
    setAudioFileToShow(null)
  }, [])

  return {
    downloadFile,
    showMoreInfo,
    audioFileToShow,
    closeMoreInfo
  }
}
