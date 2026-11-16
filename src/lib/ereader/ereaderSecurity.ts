import type { FoliateViewElement } from '@/components/ereader/foliate'
import { immediateMediaType, isBlockedExternalUrl, sanitizeEbookDocument } from '@/lib/ereader/sanitizeEbookDocument'

interface FoliateLoadDetail {
  isScript?: boolean
  allow?: boolean
}

interface FoliateDataDetail {
  data: string | Blob | Promise<string | Blob>
  type?: string
}

/** Block foliate from opening external links outside the http/https/mailto allowlist */
export function attachEpubExternalLinkGuard(view: FoliateViewElement): () => void {
  const onExternalLink = (event: Event) => {
    const detail = (event as CustomEvent<{ href_?: string; href?: string }>).detail
    const href = detail?.href_ ?? detail?.href ?? ''
    if (isBlockedExternalUrl(href)) event.preventDefault()
  }

  view.addEventListener('external-link', onExternalLink)
  return () => view.removeEventListener('external-link', onExternalLink)
}

function attachEpubTransformSecurity(transformTarget: EventTarget): () => void {
  const onLoad = (event: Event) => {
    const detail = (event as CustomEvent<FoliateLoadDetail>).detail
    if (detail.isScript) detail.allow = false
  }

  const onData = (event: Event) => {
    const detail = (event as CustomEvent<FoliateDataDetail>).detail
    const originalType = detail.type
    const immediateType = immediateMediaType(originalType)
    if (immediateType) detail.type = immediateType
    detail.data = Promise.resolve(detail.data).then(async (data) => {
      const sanitized = await sanitizeEbookDocument(data, originalType)
      if (sanitized) {
        detail.type = sanitized.type
        return sanitized.data
      }
      return data
    })
  }

  transformTarget.addEventListener('load', onLoad)
  transformTarget.addEventListener('data', onData)

  return () => {
    transformTarget.removeEventListener('load', onLoad)
    transformTarget.removeEventListener('data', onData)
  }
}

/** EPUB script hardening: transformTarget hooks + javascript: link guard */
export function attachEpubSecurity(view: FoliateViewElement): () => void {
  const cleanups: (() => void)[] = [attachEpubExternalLinkGuard(view)]
  if (view.book?.transformTarget) {
    cleanups.push(attachEpubTransformSecurity(view.book.transformTarget))
  }
  return () => {
    for (const cleanup of cleanups) cleanup()
  }
}
