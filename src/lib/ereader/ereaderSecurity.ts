import type { FoliateViewElement } from '@/components/ereader/foliate'

const CHAPTER_HTML_TYPES = new Set(['application/xhtml+xml', 'text/html'])

// Self-closing is required for EPUB XHTML
const CHAPTER_CSP_META = "<meta http-equiv=\"Content-Security-Policy\" content=\"script-src 'none'; frame-src 'none'; form-action 'none'\"/>"

function injectChapterCsp(html: string): string {
  if (/<head[\s>]/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${CHAPTER_CSP_META}`)
  }
  if (/<html[\s>]/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${CHAPTER_CSP_META}</head>`)
  }
  return `<head>${CHAPTER_CSP_META}</head>${html}`
}

interface FoliateLoadDetail {
  isScript?: boolean
  allow?: boolean
}

interface FoliateDataDetail {
  data: string | Blob | Promise<string | Blob>
  type?: string
}

const BLOCKED_EXTERNAL_PROTOCOLS = new Set(['javascript', 'data', 'vbscript'])

function isBlockedExternalUrl(href: string): boolean {
  const match = href
    .trim()
    .toLowerCase()
    .match(/^([a-z][a-z0-9+.-]*):/)
  return match ? BLOCKED_EXTERNAL_PROTOCOLS.has(match[1]) : false
}

/** Block foliate from opening dangerous URL schemes */
export function attachEpubExternalLinkGuard(view: FoliateViewElement): () => void {
  const onExternalLink = (event: Event) => {
    const href = (event as CustomEvent<{ href_?: string }>).detail?.href_ ?? ''
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
    const type = detail.type?.toLowerCase() ?? ''
    if (!CHAPTER_HTML_TYPES.has(type)) return

    detail.data = Promise.resolve(detail.data).then((data) => {
      if (typeof data !== 'string') return data
      return injectChapterCsp(data)
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
