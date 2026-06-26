import { parseUploadErrorMessage } from '@/lib/uploadErrors'
import type { UploadProgressInfo } from '@/types/upload'

/**
 * Upload a backup archive via the internal-api proxy so httpOnly cookies and
 * token refresh are handled server-side.
 */
export async function uploadBackupArchive(file: File, onProgress?: (progress: UploadProgressInfo) => void): Promise<void> {
  const form = new FormData()
  form.set('file', file)

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/internal-api/backups/upload', true)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          percent: Math.round((event.loaded / event.total) * 100),
          loaded: event.loaded,
          total: event.total
        })
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress && file.size > 0) {
          onProgress({
            percent: 100,
            loaded: file.size,
            total: file.size
          })
        }
        resolve()
      } else {
        const msg = parseUploadErrorMessage(xhr.status, xhr.responseText || '')
        reject(new Error(msg))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Upload failed due to network error'))
    }

    xhr.send(form)
  })
}
