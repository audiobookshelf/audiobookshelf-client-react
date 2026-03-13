import { AudioFile } from '@/types/api'
import { useCallback, useState } from 'react'

export function useLibraryFileActions(libraryItemId: string) {
  const [audioFileToShow, setAudioFileToShow] = useState<AudioFile | null>(null)

  const downloadFile = useCallback(
    (ino: string, filename: string) => {
      const downloadUrl = `/internal-api/items/${libraryItemId}/file/${ino}/download`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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
