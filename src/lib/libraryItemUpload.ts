import { parseUploadErrorMessage } from '@/lib/uploadErrors'
import type { Library } from '@/types/api'
import type { UploadProgressInfo } from '@/types/upload'

export interface LibraryItemUploadInput {
  title: string
  author?: string
  series?: string
  itemFiles: File[]
}

/**
 * Upload library item files via the internal-api proxy so httpOnly cookies and
 * token refresh are handled server-side.
 */
export async function uploadLibraryItem(
  item: LibraryItemUploadInput,
  libraryId: string,
  folderId: string,
  mediaType: Library['mediaType'],
  onProgress?: (progress: UploadProgressInfo) => void
): Promise<void> {
  const form = new FormData()
  form.set('title', item.title)
  if (mediaType !== 'podcast') {
    form.set('author', item.author || '')
    form.set('series', item.series || '')
  }
  form.set('library', libraryId)
  form.set('folder', folderId)

  let index = 0
  item.itemFiles.forEach((file) => {
    form.set(`${index++}`, file)
  })

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/internal-api/items/upload', true)

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
        if (onProgress) {
          const totalSize = item.itemFiles.reduce((sum, file) => sum + file.size, 0)
          onProgress({
            percent: 100,
            loaded: totalSize,
            total: totalSize
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
