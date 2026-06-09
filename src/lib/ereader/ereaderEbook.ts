import type { FoliateRelocateDetail, FoliateViewElement } from '@/components/ereader/foliate'
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

/** Spine index from the package-path prefix (`/6/16` to 7) */
export function getSpineIndexFromEpubCfi(cfi: string): number | undefined {
  const match = cfi.match(/^epubcfi\(\/6\/(\d+)/)
  if (!match) return undefined

  const spineStep = Number(match[1])
  if (Number.isNaN(spineStep) || spineStep < 2) return undefined

  return spineStep / 2 - 1
}

/** Element id assertions from the content path (after `!`) */
export function extractEpubCfiElementIds(cfi: string): string[] {
  const inner = cfi.match(/^epubcfi\((.*)\)$/)?.[1]
  if (!inner) return []

  const content = inner.includes('!') ? inner.split('!').slice(1).join('!') : inner
  const ids: string[] = []

  for (const match of content.matchAll(/\/\d+\[([^\];,^]+)(?:;[^\]]*)?\]/g)) {
    ids.push(match[1].replace(/\^(.)/g, '$1'))
  }

  return ids
}

/**
 * epub.js writes collapsed point CFIs (`!/4/2[id]/1:0`)
 * Foliate often writes range-style CFIs with commas (`!/4,/2[id],/20[id]/1:141`)
 */
export function isCollapsedEpubjsStyleCfi(cfi: string): boolean {
  const inner = cfi.match(/^epubcfi\((.*)\)$/)?.[1]
  if (!inner?.includes('!')) return true

  return !inner
    .split('!')
    .slice(1)
    .some((part) => part.includes(','))
}

async function tryResumeViaEpubCfiElementIds(view: FoliateViewElement, cfi: string): Promise<boolean> {
  const spineIndex = getSpineIndexFromEpubCfi(cfi)
  const ids = extractEpubCfiElementIds(cfi)
  const sectionHref = spineIndex != null ? view.book?.sections?.[spineIndex]?.id : undefined

  if (!ids.length || !sectionHref) return false

  await view.init({ showTextStart: true })

  for (const id of [...ids].reverse()) {
    const resolved = await view.goTo(`${sectionHref}#${id}`)
    if (resolved) return true
  }

  return false
}

/** Resume reflowable EPUB progress, with fallbacks for epub.js CFIs saved by the Vue client */
export async function resumeEpubLocation(view: FoliateViewElement, cfi: string, ebookProgress?: number): Promise<boolean> {
  if (isCollapsedEpubjsStyleCfi(cfi)) {
    if (await tryResumeViaEpubCfiElementIds(view, cfi)) return true
  }

  try {
    await view.init({ lastLocation: cfi })
    return true
  } catch (error) {
    console.warn('Failed to resume at saved CFI', cfi, error)
  }

  // fall back to using progress percentage
  if (ebookProgress != null && ebookProgress > 0 && ebookProgress < 1) {
    try {
      await view.init({ showTextStart: true })
      await view.goToFraction(ebookProgress)
      return true
    } catch (error) {
      console.warn('Failed to resume at saved ebook progress fraction', ebookProgress, error)
    }
  }

  // if all else fails, open at start of book
  await view.init({ showTextStart: true })
  return false
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
