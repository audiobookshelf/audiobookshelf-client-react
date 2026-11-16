const MIME_HTML = 'text/html'
const MIME_XHTML = 'application/xhtml+xml'
const MIME_SVG = 'image/svg+xml'
const MIME_XML = 'application/xml'
const MIME_TEXT_XML = 'text/xml'
const MIME_TEXT_XSL = 'text/xsl'
const MIME_CSS = 'text/css'
const MIME_PLAIN = 'text/plain'

const XHTML_NS = 'http://www.w3.org/1999/xhtml'

const EMPTY_HTML = '<!DOCTYPE html><html><head></head><body></body></html>'
const EMPTY_XHTML = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body></body></html>'
const EMPTY_SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
const EMPTY_XML = '<empty/>'

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http', 'https', 'mailto'])

// Packaged resources are rewritten to blob URLs. 'self' is omitted because a blob document inherits the app origin and would allow cookie-bearing requests to the server.
export const DOCUMENT_CSP = [
  "default-src 'none'",
  "script-src 'none'",
  "style-src 'unsafe-inline' blob: data:",
  'img-src blob: data:',
  'font-src blob: data:',
  'media-src blob: data:',
  "connect-src 'none'",
  "worker-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ')

type EbookDocumentType = typeof MIME_HTML | typeof MIME_XHTML | typeof MIME_SVG | typeof MIME_XML

const SCRIPTABLE_DOCUMENT_TYPES = new Set<string>([MIME_HTML, MIME_XHTML, MIME_SVG])

const GENERIC_XML_TYPES = new Set<string>([MIME_XML, MIME_TEXT_XML, MIME_TEXT_XSL])

const INERT_APPLICATION_TYPES = new Set([
  'application/font-sfnt',
  'application/vnd.ms-opentype',
  'application/font-woff',
  'application/font-woff2',
  'application/octet-stream'
])

const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'poster', 'data', 'cite', 'ping', 'background', 'dynsrc', 'lowsrc', 'xlink:href'])

const SVG_ANIMATION_ELEMENTS = new Set(['set', 'animate', 'animatetransform', 'animatemotion'])

// DOMParser runs with scripting off, so noscript children are elements. The chapter iframe has allow-scripts, so those same bytes are raw text that end at the first closing tag.
// Removing the element drops markup that reparses into a different tree. The reader never displays noscript content.
const SCRIPTABLE_ELEMENTS = new Set(['script', 'noscript', 'handler', 'listener', 'iframe', 'frame', 'object', 'embed', 'portal', 'base'])

export interface SanitizeEbookDocumentResult {
  data: string
  type: string
}

/** Media-type essence: type/subtype with parameters and whitespace removed. */
export function mediaTypeEssence(type: string | undefined | null): string {
  const [essencePart] = (type ?? '').split(';')
  return essencePart.trim().toLowerCase()
}

function isGenericXmlEssence(essence: string): boolean {
  return GENERIC_XML_TYPES.has(essence) || (essence.endsWith('+xml') && !SCRIPTABLE_DOCUMENT_TYPES.has(essence))
}

/** Strip ASCII whitespace and C0 controls so java\tscript: still matches. */
function normalizeUrlForSchemeCheck(href: string): string {
  return href.replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase()
}

/** Only allow http, https, and mailto when foliate opens an external link; fail closed on everything else. */
export function isBlockedExternalUrl(href: string): boolean {
  const normalized = normalizeUrlForSchemeCheck(href)
  const match = normalized.match(/^([a-z][a-z0-9+.-]*):/)
  if (!match) return true
  return !ALLOWED_EXTERNAL_PROTOCOLS.has(match[1])
}

function isDangerousUrl(value: string): boolean {
  const normalized = normalizeUrlForSchemeCheck(value)
  if (/^(javascript|vbscript):/i.test(normalized)) return true
  if (!normalized.startsWith('data:')) return false
  const afterScheme = normalized.slice('data:'.length)
  const commaIndex = afterScheme.indexOf(',')
  if (commaIndex < 0) return true
  const essence = mediaTypeEssence(afterScheme.slice(0, commaIndex))
  return SCRIPTABLE_DOCUMENT_TYPES.has(essence) || isGenericXmlEssence(essence)
}

/** A URL the document would fetch on its own. Book links are exempt; see isBookLinkHref. */
function isRemoteUrl(value: string): boolean {
  const normalized = normalizeUrlForSchemeCheck(value)
  return normalized.startsWith('http:') || normalized.startsWith('https:') || normalized.startsWith('//')
}

/** http(s) hrefs on a and area are clicks foliate opens. They are not subresource loads. */
function isBookLinkHref(el: Element, attr: Attr): boolean {
  const tag = el.localName.toLowerCase()
  if (tag !== 'a' && tag !== 'area') return false
  if (attributeLocalName(attr) !== 'href') return false
  const normalized = normalizeUrlForSchemeCheck(attr.value)
  return normalized.startsWith('http:') || normalized.startsWith('https:')
}

/** Remove url() and @import targets that point at the network. blob:, data:, and relative urls stay. */
function stripRemoteCssUrls(css: string): string {
  const withoutImports = css.replace(/@import\b[^;]*;?/gi, (rule) => {
    const target = /(['"])([^'"]+)\1/.exec(rule)?.[2] ?? /url\(\s*([^)\s]+)/i.exec(rule)?.[1]
    return target && isRemoteUrl(target) ? '' : rule
  })
  return withoutImports.replace(/url\(\s*(['"]?)([\s\S]*?)\1\s*\)/gi, (match, _quote, url: string) => (isRemoteUrl(url) ? '' : match))
}

/** Drop remote srcset candidates. Returns the original string when nothing was remote. */
function srcsetWithoutRemoteUrls(srcset: string): string {
  let dropped = false
  const kept: string[] = []
  for (const entry of srcset.split(',')) {
    const trimmed = entry.trim()
    if (!trimmed) continue
    const urlPart = trimmed.split(/\s+/)[0]
    if (isRemoteUrl(urlPart)) {
      dropped = true
      continue
    }
    kept.push(trimmed)
  }
  return dropped ? kept.join(', ') : srcset
}

function hasDangerousSrcsetCandidate(srcset: string): boolean {
  for (const entry of srcset.split(',')) {
    const trimmed = entry.trim()
    if (!trimmed) continue
    const urlPart = trimmed.split(/\s+/)[0]
    if (isDangerousUrl(urlPart)) return true
  }
  return false
}

function isInertMediaType(essence: string): boolean {
  if (!essence) return false
  if (essence === MIME_CSS || essence === MIME_PLAIN) return true
  if (INERT_APPLICATION_TYPES.has(essence)) return true
  if (essence.startsWith('audio/') || essence.startsWith('video/') || essence.startsWith('font/')) return true
  if (essence.startsWith('application/font-') || essence.startsWith('application/x-font-')) return true
  if (essence.startsWith('image/') && essence !== MIME_SVG) return true
  return false
}

/**
 * Type to publish on the data event before the payload promise settles.
 * Foliate awaits the payload first, then the type; setting this up front still covers a synchronous read.
 */
export function immediateMediaType(type: string | undefined): string | null {
  const essence = mediaTypeEssence(type)
  if (isInertMediaType(essence)) return null
  if (essence === MIME_HTML) return `${MIME_HTML};charset=utf-8`
  if (essence === MIME_XHTML || essence === MIME_SVG) return essence
  if (essence === MIME_TEXT_XSL) return MIME_XML
  if (isGenericXmlEssence(essence)) return essence
  return MIME_PLAIN
}

function emptyDocumentFor(type: EbookDocumentType): string {
  if (type === MIME_SVG) return EMPTY_SVG
  if (type === MIME_XHTML) return EMPTY_XHTML
  if (type === MIME_XML) return EMPTY_XML
  return EMPTY_HTML
}

function canonicalOutputType(sanitizeAs: EbookDocumentType, originalEssence: string): string {
  if (sanitizeAs === MIME_HTML) return `${MIME_HTML};charset=utf-8`
  if (sanitizeAs === MIME_XML && isGenericXmlEssence(originalEssence) && originalEssence !== MIME_TEXT_XSL) return originalEssence
  return sanitizeAs
}

function hasParserError(doc: Document): boolean {
  return !doc.documentElement || doc.getElementsByTagName('parsererror').length > 0
}

function parseDocument(text: string, type: EbookDocumentType): Document | null {
  try {
    return new DOMParser().parseFromString(text, type)
  } catch {
    return null
  }
}

function attributeLocalName(attr: Attr): string {
  return (attr.localName || attr.name).toLowerCase()
}

function attributeQualifiedName(attr: Attr): string {
  return attr.name.toLowerCase()
}

function isEventHandlerAttribute(attr: Attr): boolean {
  const name = attributeLocalName(attr)
  return name.startsWith('on')
}

function isUrlAttribute(attr: Attr): boolean {
  const local = attributeLocalName(attr)
  const qualified = attributeQualifiedName(attr)
  return URL_ATTRIBUTES.has(local) || URL_ATTRIBUTES.has(qualified) || local === 'href'
}

function removeNode(node: Node): void {
  node.parentNode?.removeChild(node)
}

function sanitizeElementAttributes(el: Element): void {
  const attrs = Array.from(el.attributes)
  for (const attr of attrs) {
    if (isEventHandlerAttribute(attr)) {
      el.removeAttributeNode(attr)
      continue
    }

    const local = attributeLocalName(attr)
    if (local === 'srcdoc') {
      el.removeAttributeNode(attr)
      continue
    }

    if (local === 'style') {
      const stripped = stripRemoteCssUrls(attr.value)
      if (stripped !== attr.value) {
        if (stripped.trim()) el.setAttribute(attr.name, stripped)
        else el.removeAttributeNode(attr)
      }
      continue
    }

    if (local === 'srcset') {
      if (hasDangerousSrcsetCandidate(attr.value)) {
        el.removeAttributeNode(attr)
        continue
      }
      const filtered = srcsetWithoutRemoteUrls(attr.value)
      if (filtered !== attr.value) {
        if (filtered) el.setAttribute(attr.name, filtered)
        else el.removeAttributeNode(attr)
      }
      continue
    }

    if (isUrlAttribute(attr) && (isDangerousUrl(attr.value) || (isRemoteUrl(attr.value) && !isBookLinkHref(el, attr)))) {
      el.removeAttributeNode(attr)
    }
  }
}

function isNonUtf8CharsetMeta(el: Element): boolean {
  const charset = el.getAttribute('charset')?.trim().toLowerCase()
  if (charset && charset !== 'utf-8' && charset !== 'utf8') return true

  const httpEquiv = el.getAttribute('http-equiv')?.trim().toLowerCase()
  if (httpEquiv === 'content-type') {
    const content = el.getAttribute('content') ?? ''
    const match = content.match(/charset\s*=\s*([^\s;"']+)/i)
    const metaCharset = match?.[1]?.toLowerCase()
    if (metaCharset && metaCharset !== 'utf-8' && metaCharset !== 'utf8') return true
  }

  return false
}

/**
 * preconnect and dns-prefetch still run when the CSP meta is not applied (SVG, generic XML).
 * Keep a link only when rel is stylesheet or icon.
 * Foliate rewrites a packaged stylesheet to blob: before this hook and leaves any other href unchanged.
 */
function isDisallowedLink(el: Element): boolean {
  const rel = (el.getAttribute('rel') ?? '').toLowerCase().split(/\s+/).filter(Boolean)
  const isStylesheet = rel.includes('stylesheet')
  if (!isStylesheet && !rel.includes('icon')) return true
  if (!isStylesheet) return false

  const href = el.getAttribute('href')
  if (!href || isDangerousUrl(href)) return true
  const normalized = normalizeUrlForSchemeCheck(href)
  return !normalized.startsWith('blob:') && !normalized.startsWith('data:')
}

function isScriptableElement(el: Element): boolean {
  const name = el.localName.toLowerCase()
  if (SCRIPTABLE_ELEMENTS.has(name)) return true
  if (name === 'link' && isDisallowedLink(el)) return true
  if (name === 'meta') {
    const httpEquiv = el.getAttribute('http-equiv')?.trim().toLowerCase()
    if (httpEquiv === 'refresh') return true
    if (isNonUtf8CharsetMeta(el)) return true
  }
  return false
}

function animationAttributeHasDangerousUrl(value: string | null): boolean {
  if (!value) return false
  if (isDangerousUrl(value) || isRemoteUrl(value) || stripRemoteCssUrls(value) !== value) return true
  return value.split(';').some((part) => isDangerousUrl(part) || isRemoteUrl(part))
}

function isDangerousAnimationTarget(localTarget: string): boolean {
  if (!localTarget) return false
  if (localTarget.startsWith('on') || localTarget === 'srcdoc') return true
  return URL_ATTRIBUTES.has(localTarget) || localTarget === 'href'
}

function isDangerousSvgAnimation(el: Element): boolean {
  const name = el.localName.toLowerCase()
  if (!SVG_ANIMATION_ELEMENTS.has(name)) return false

  const rawTarget = (el.getAttribute('attributeName') || el.getAttribute('attributename') || '').trim().toLowerCase()
  const localTarget = rawTarget.includes(':') ? rawTarget.slice(rawTarget.indexOf(':') + 1) : rawTarget
  if (isDangerousAnimationTarget(localTarget)) return true

  return ['from', 'by', 'to', 'values'].some((attribute) => animationAttributeHasDangerousUrl(el.getAttribute(attribute)))
}

/** Top-level pseudo-attributes only, so type=text/css inside another quoted value does not count. */
function xmlStylesheetPseudoAttributes(data: string): Map<string, string> {
  const attributes = new Map<string, string>()
  let index = 0
  while (index < data.length) {
    while (index < data.length && /\s/.test(data[index])) index++
    if (index >= data.length || !/[A-Za-z_:]/.test(data[index])) break

    const nameStart = index
    index++
    while (index < data.length && /[\w:.-]/.test(data[index])) index++
    const name = data.slice(nameStart, index).toLowerCase()

    while (index < data.length && /\s/.test(data[index])) index++
    if (data[index] !== '=') break
    index++
    while (index < data.length && /\s/.test(data[index])) index++

    const quote = data[index]
    let value = ''
    if (quote === '"' || quote === "'") {
      const end = data.indexOf(quote, index + 1)
      if (end < 0) break
      value = data.slice(index + 1, end)
      index = end + 1
    } else {
      const start = index
      while (index < data.length && !/\s/.test(data[index])) index++
      value = data.slice(start, index)
    }
    attributes.set(name, value)
  }
  return attributes
}

/**
 * xml-stylesheet is applied before the CSP meta exists.
 * Foliate rewrites a packaged sheet to blob: before this hook and leaves an external URL unchanged.
 * Keep the instruction only when href is missing or already a blob: URL.
 */
function isSafeCssStylesheetInstruction(data: string): boolean {
  const attributes = xmlStylesheetPseudoAttributes(data)
  if (mediaTypeEssence(attributes.get('type')) !== MIME_CSS) return false
  const href = attributes.get('href')
  if (!href) return true
  return normalizeUrlForSchemeCheck(href).startsWith('blob:')
}

function walkAndSanitize(root: Node): void {
  const nodes: Node[] = [root]
  while (nodes.length) {
    const node = nodes.pop()!
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      if (isScriptableElement(el) || isDangerousSvgAnimation(el)) {
        removeNode(el)
        continue
      }
      sanitizeElementAttributes(el)

      // SVG has no CSP meta, so a <style> block can still fetch url() and @import targets
      if (el.localName.toLowerCase() === 'style' && el.textContent) {
        const stripped = stripRemoteCssUrls(el.textContent)
        if (stripped !== el.textContent) el.textContent = stripped
      }

      // <template>.content is a DocumentFragment not in childNodes
      if (el.localName.toLowerCase() === 'template') {
        const template = el as HTMLTemplateElement
        if (template.content) walkAndSanitize(template.content)
      }
    }

    if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      const pi = node as ProcessingInstruction
      if (pi.target.toLowerCase() === 'xml-stylesheet' && !isSafeCssStylesheetInstruction(pi.data)) {
        removeNode(pi)
        continue
      }
    }

    const children = node.childNodes
    for (let i = children.length - 1; i >= 0; i--) {
      nodes.push(children[i])
    }
  }
}

function isXhtmlHtmlRoot(doc: Document): boolean {
  const root = doc.documentElement
  return root?.namespaceURI === XHTML_NS && root.localName.toLowerCase() === 'html'
}

/**
 * A CSP meta is enforced only inside a head in the XHTML namespace.
 * A null-namespace head matches localName, and the XHTML parser does not treat a meta there as the document policy.
 * Prepend a new XHTML head as the first child of the root.
 */
function ensureCspMeta(doc: Document): void {
  const root = doc.documentElement
  if (!root || !isXhtmlHtmlRoot(doc)) return

  const head = doc.createElementNS(XHTML_NS, 'head')
  const meta = doc.createElementNS(XHTML_NS, 'meta')
  meta.setAttribute('http-equiv', 'Content-Security-Policy')
  meta.setAttribute('content', DOCUMENT_CSP)
  head.appendChild(meta)
  root.insertBefore(head, root.firstChild)
}

function serializeDocument(doc: Document, type: EbookDocumentType): string {
  if (type === MIME_HTML) {
    // Prefer outerHTML so the doctype and html shell stay HTML-shaped
    const html = doc.documentElement?.outerHTML
    if (html) {
      const doctype = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>` : '<!DOCTYPE html>'
      return `${doctype}${html}`
    }
  }
  return new XMLSerializer().serializeToString(doc)
}

function resolveSanitizeType(essence: string): EbookDocumentType | null {
  if (SCRIPTABLE_DOCUMENT_TYPES.has(essence)) return essence as EbookDocumentType
  if (isGenericXmlEssence(essence)) return MIME_XML
  return null
}

async function readPayloadText(data: string | Blob): Promise<string | null> {
  if (typeof data === 'string') return data
  if (data instanceof Blob) return data.text()
  return null
}

/**
 * Sanitize an ebook document payload before foliate turns it into a blob URL.
 * Returns null when the payload should pass through unchanged (inert or unrecognized types).
 */
export async function sanitizeEbookDocument(data: string | Blob, type: string | undefined): Promise<SanitizeEbookDocumentResult | null> {
  const essence = mediaTypeEssence(type)
  if (isInertMediaType(essence)) return null

  let sanitizeAs = resolveSanitizeType(essence)
  if (!sanitizeAs) return null

  const text = await readPayloadText(data)
  if (text === null) return null

  let outputType = canonicalOutputType(sanitizeAs, essence)

  let doc = parseDocument(text, sanitizeAs)
  // Match foliate: invalid XHTML may be recoverable as HTML
  if (doc && sanitizeAs === MIME_XHTML && (hasParserError(doc) || !doc.documentElement?.namespaceURI)) {
    sanitizeAs = MIME_HTML
    outputType = canonicalOutputType(MIME_HTML, essence)
    doc = parseDocument(text, MIME_HTML)
  }

  if (!doc || hasParserError(doc)) return { data: emptyDocumentFor(sanitizeAs), type: outputType }

  // A CSP meta is only enforced on an XHTML <html> root. An SVG or other root labeled as HTML still fetches remote URLs.
  if ((sanitizeAs === MIME_HTML || sanitizeAs === MIME_XHTML) && !isXhtmlHtmlRoot(doc)) {
    return { data: EMPTY_XHTML, type: MIME_XHTML }
  }

  walkAndSanitize(doc)

  if (sanitizeAs === MIME_HTML || sanitizeAs === MIME_XHTML) ensureCspMeta(doc)

  return { data: serializeDocument(doc, sanitizeAs), type: outputType }
}
