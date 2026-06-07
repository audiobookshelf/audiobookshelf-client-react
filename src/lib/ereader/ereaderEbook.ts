import type { FoliateRelocateDetail } from '@/components/ereader/foliate'
import type { BookMedia } from '@/types/api'

/** Minified items put ebookFormat on media, expanded includes entire ebookFile */
export function getEbookFormat(media: Pick<BookMedia, 'ebookFormat' | 'ebookFile'>): string | undefined {
  return media.ebookFormat ?? media.ebookFile?.ebookFormat
}

const EBOOK_MIME: Record<string, string> = {
  epub: 'application/epub+zip',
  pdf: 'application/pdf',
  mobi: 'application/x-mobipocket-ebook',
  azw3: 'application/vnd.amazon.mobi8-ebook',
  azw: 'application/vnd.amazon.mobi8-ebook',
  cbz: 'application/vnd.comicbook+zip',
  cbr: 'application/x-cbr',
  fb2: 'application/x-fictionbook+xml'
}

/** Foliate format detection uses File.name */
export function blobToEbookFile(blob: Blob, format: string, title: string): File {
  const ext = format.toLowerCase()
  const safeName = title.replace(/[^\w.-]+/g, '_').slice(0, 100) || 'book'
  const name = `${safeName}.${ext}`
  const type = EBOOK_MIME[ext] ?? blob.type ?? 'application/octet-stream'
  return new File([blob], name, { type })
}

// ebookLocation is saved as a single page number
const PAGE_BASED_FORMATS = new Set(['pdf', 'cbz', 'cbr'])

export function usesPageBasedProgress(format: string): boolean {
  return PAGE_BASED_FORMATS.has(format.toLowerCase())
}

export type EbookProgressUpdate = {
  ebookLocation: string | number
  ebookProgress?: number
}

/** Parse a 1-based page from saved progress */
export function parseResumePage(location: string | undefined, format: string): number | undefined {
  if (!location || !usesPageBasedProgress(format)) return undefined

  const page = Number(location)
  if (Number.isNaN(page) || page < 1) return undefined
  return Math.floor(page)
}

export function parseResumeCfi(location: string | undefined, format: string): string | undefined {
  if (!location || usesPageBasedProgress(format)) return undefined
  return location.startsWith('epubcfi') ? location : undefined
}

export function progressFromRelocate(detail: FoliateRelocateDetail, format: string): EbookProgressUpdate | null {
  if (usesPageBasedProgress(format)) {
    const pageIndex = detail.section?.current
    const totalPages = detail.section?.total
    if (typeof pageIndex !== 'number') return null

    const page = pageIndex + 1
    const ebookProgress =
      typeof totalPages === 'number' && totalPages > 0
        ? Math.max(0, Math.min(1, (page - 1) / totalPages))
        : typeof detail.fraction === 'number'
          ? Math.max(0, Math.min(1, detail.fraction))
          : undefined

    return { ebookLocation: page, ebookProgress }
  }

  const cfi = detail.cfi
  if (!cfi?.startsWith('epubcfi')) return null

  return {
    ebookLocation: cfi,
    ...(typeof detail.fraction === 'number' ? { ebookProgress: detail.fraction } : {})
  }
}
