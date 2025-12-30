import { SupportedFileTypes } from '@/lib/fileUtils'
import type { Library } from '@/types/api'
import path from 'path'
import { ItemToUpload } from './UploadClient'

export interface FileWithMetadata extends File {
  filetype?: string | false
  filepath?: string
}

interface UploadItemData {
  itemFiles: FileWithMetadata[]
  otherFiles: FileWithMetadata[]
  ignoredFiles: FileWithMetadata[]
}

export interface CleanedItem extends UploadItemData {
  index: number
  title: string
  author?: string
  series?: string
}

export interface ProcessedItems {
  items: CleanedItem[]
  ignoredFiles: FileWithMetadata[]
  error?: string
}

/**
 * Check file type based on extension
 */
function checkFileType(filename: string): string | false {
  let ext = path.extname(filename)
  if (!ext) return false
  if (ext.startsWith('.')) ext = ext.slice(1)
  ext = ext.toLowerCase()

  for (const filetype in SupportedFileTypes) {
    if (SupportedFileTypes[filetype as keyof typeof SupportedFileTypes].includes(ext)) {
      return filetype
    }
  }
  return false
}

/**
 * Clean book data - extract title, author, series from file path
 */
function cleanBook(book: UploadItemData, index: number): CleanedItem {
  const audiobook: CleanedItem = {
    index,
    title: '',
    author: '',
    series: '',
    ...book
  }

  const firstBookFile = book.itemFiles[0]
  if (!firstBookFile?.filepath) {
    return audiobook
  }

  const firstBookPath = path.dirname(firstBookFile.filepath)
  const dirs = firstBookPath.split('/').filter((d) => !!d && d !== '.')

  if (dirs.length) {
    audiobook.title = dirs.pop() || ''
    if (dirs.length > 1) {
      audiobook.series = dirs.pop()
    }
    if (dirs.length) {
      audiobook.author = dirs.pop()
    }
  } else {
    audiobook.title = path.basename(firstBookFile.name, path.extname(firstBookFile.name))
  }

  return audiobook
}

/**
 * Clean podcast data - extract title from file path
 */
function cleanPodcast(item: UploadItemData, index: number): CleanedItem {
  const podcast: CleanedItem = {
    index,
    title: '',
    ...item
  }

  const firstAudioFile = item.itemFiles[0]
  if (!firstAudioFile?.filepath) return podcast

  const firstPath = path.dirname(firstAudioFile.filepath)
  const dirs = firstPath.split('/').filter((d) => !!d && d !== '.')

  if (dirs.length) {
    podcast.title = dirs.length > 1 ? dirs[1] : dirs[0]
  } else {
    podcast.title = path.basename(firstAudioFile.name, path.extname(firstAudioFile.name))
  }

  return podcast
}

/**
 * Clean item based on media type
 */
function cleanItem(item: UploadItemData, mediaType: string, index: number): CleanedItem {
  if (mediaType === 'podcast') return cleanPodcast(item, index)
  return cleanBook(item, index)
}

/**
 * Process items from FileList (file picker)
 */
export function getItemsFromFilelist(filelist: FileList, mediaType: Library['mediaType']): ProcessedItems {
  const ignoredFiles: FileWithMetadata[] = []
  const otherFiles: FileWithMetadata[] = []
  interface ItemMapEntry extends UploadItemData {
    path: string
  }
  const itemMap: Record<string, ItemMapEntry> = {}

  Array.from(filelist).forEach((file) => {
    const fileWithMeta = file as FileWithMetadata
    const filetype = checkFileType(file.name)

    if (!filetype) {
      ignoredFiles.push(fileWithMeta)
    } else {
      fileWithMeta.filetype = filetype
      fileWithMeta.filepath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name

      if (filetype === 'audio' || (filetype === 'ebook' && mediaType === 'book')) {
        let dir = fileWithMeta.filepath ? path.dirname(fileWithMeta.filepath) : ''
        if (dir === '.') dir = ''

        if (!itemMap[dir]) {
          itemMap[dir] = { path: dir, ignoredFiles: [], itemFiles: [], otherFiles: [] }
        }
        itemMap[dir].itemFiles.push(fileWithMeta)
      } else {
        otherFiles.push(fileWithMeta)
      }
    }
  })

  otherFiles.forEach((file) => {
    const dir = path.dirname(file.filepath || '')
    const findItem = Object.values(itemMap).find((b) => dir.startsWith(b.path))
    if (findItem) {
      findItem.otherFiles.push(file)
    } else {
      ignoredFiles.push(file)
    }
  })

  let items: CleanedItem[] = []
  let index = 1

  if (itemMap[''] && !otherFiles.length && mediaType === 'book' && !itemMap[''].itemFiles.some((f) => f.filetype !== 'audio')) {
    items = itemMap[''].itemFiles.map((audioFile) => {
      return cleanItem({ itemFiles: [audioFile], otherFiles: [], ignoredFiles: [] }, mediaType, index++)
    })
  } else {
    items = Object.values(itemMap).map((i) => cleanItem(i, mediaType, index++))
  }

  return { items, ignoredFiles }
}

/**
 *
 * Note that this cannot be in a 'server' function module because it uses FormData, and next
 * does not seem to handle FormData in server actions very well.
 * @param item
 * @param libraryId
 * @param folderId
 * @param mediaType
 * @param onProgress
 * @returns
 */
export async function upload(
  item: ItemToUpload,
  libraryId: string,
  folderId: string,
  mediaType: Library['mediaType'],
  cookie: string,
  onProgress?: (progress: number) => void
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

  // Use XMLHttpRequest for upload progress tracking
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload', true)
    xhr.setRequestHeader('Authorization', `Bearer ${cookie}`)

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100)
        resolve()
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Upload failed due to network error'))
    }

    xhr.send(form)
  })
}
