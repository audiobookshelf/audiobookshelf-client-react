import type { FoliateRelocateDetail, FoliateRendererElement } from '@/components/ereader/foliate'
import type { EreaderTocItem } from '@/lib/ereader/ereaderToc'

export interface ComicPageInfo {
  pageIndex: number
  totalPages: number
  filename: string | null
}

export function getComicPageIndex(detail: FoliateRelocateDetail): number | null {
  const index = detail.section?.current ?? detail.index
  return typeof index === 'number' ? index : null
}

export function getComicPageFilename(toc: EreaderTocItem[], pageIndex: number): string | null {
  if (pageIndex < 0 || pageIndex >= toc.length) return null
  return toc[pageIndex]?.href ?? null
}

export function getComicPageInfo(toc: EreaderTocItem[], pageIndex: number): ComicPageInfo | null {
  if (pageIndex < 0 || toc.length === 0) return null

  return {
    pageIndex,
    totalPages: toc.length,
    filename: getComicPageFilename(toc, pageIndex)
  }
}

export function getComicDownloadBasename(path: string): string {
  const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return slash >= 0 ? path.slice(slash + 1) : path
}

/** Read the current page image URL from foliate's fixed-layout renderer */
export function getComicPageImageUrl(renderer: FoliateRendererElement): string | null {
  const contents = renderer.getContents?.()
  if (!contents?.length) return null

  for (const { doc } of contents) {
    const src = doc?.querySelector('img')?.src
    if (src) return src
  }

  return null
}

export function getComicPageImageUrlFromDoc(doc: Document): string | null {
  return doc.querySelector('img')?.src || null
}

export async function downloadComicPageImage(imageUrl: string, archivePath: string): Promise<void> {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Failed to fetch page image (${response.status})`)

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = getComicDownloadBasename(archivePath)
  link.click()
  URL.revokeObjectURL(objectUrl)
}
