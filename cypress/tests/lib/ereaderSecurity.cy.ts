import type { FoliateViewElement } from '@/components/ereader/foliate'
import { attachEpubSecurity } from '@/lib/ereader/ereaderSecurity'
import { DOCUMENT_CSP, isBlockedExternalUrl, sanitizeEbookDocument } from '@/lib/ereader/sanitizeEbookDocument'
import { mediaTypeEssence } from '@/lib/mediaType'

const MARKER = 'window.__ereaderSecurityProbe = true'
const TRACKER_URL_PATTERN = /^https:\/\/tracker\.example\//

async function loadInSandboxedIframe(htmlOrSvg: string, type: string): Promise<boolean> {
  const blob = new Blob([htmlOrSvg], { type })
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts')
  iframe.style.cssText = 'position:fixed;width:1px;height:1px;border:0;opacity:0'

  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const finish = (error?: Error) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        iframe.removeEventListener('load', onLoad)
        if (error) reject(error)
        else resolve()
      }
      const onLoad = () => {
        let href = ''
        try {
          href = iframe.contentWindow?.location.href ?? ''
        } catch {
          href = ''
        }
        // about:blank fires before the blob document. The probe is always unset there.
        if (!href.startsWith('blob:')) return
        finish()
      }
      const timer = setTimeout(() => finish(new Error('sandboxed iframe did not load')), 8000)
      iframe.addEventListener('load', onLoad)
      iframe.addEventListener('error', () => finish(new Error('iframe failed to load')), { once: true })
      iframe.src = url
      document.body.appendChild(iframe)
    })
    // Scripts run synchronously during parse; give the event loop a turn for any deferred work
    await new Promise((resolve) => setTimeout(resolve, 0))
    return Boolean((iframe.contentWindow as Window & { __ereaderSecurityProbe?: boolean })?.__ereaderSecurityProbe)
  } finally {
    iframe.remove()
    URL.revokeObjectURL(url)
  }
}

function trackerWasRequested(hits: string[], timeoutMs: number): Promise<boolean> {
  const start = Date.now()
  return new Promise((resolve) => {
    const check = () => {
      if (hits.length > 0 || Date.now() - start >= timeoutMs) {
        resolve(hits.length > 0)
        return
      }
      setTimeout(check, 20)
    }
    check()
  })
}

// The unsanitized load has to request the tracker. A page CSP that blocks every subresource would make the sanitized assertion pass without testing the document.
function expectSanitizedDocumentDoesNotRequestTracker(input: string, type: string): void {
  const hits: string[] = []
  cy.intercept(TRACKER_URL_PATTERN, (req) => {
    hits.push(req.url)
    req.reply({ statusCode: 204, body: '' })
  })

  cy.then(async () => {
    hits.length = 0
    await loadInSandboxedIframe(input, type)
    expect(await trackerWasRequested(hits, 1000), 'unsanitized document requests the tracker').to.equal(true)

    const result = await sanitizeEbookDocument(input, type)
    expect(result).to.not.equal(null)
    hits.length = 0
    await loadInSandboxedIframe(result!.data, result!.type)
    expect(await trackerWasRequested(hits, 400), 'sanitized document does not request the tracker').to.equal(false)
  })
}

describe('mediaTypeEssence', () => {
  it('strips parameters, whitespace, and casing', () => {
    expect(mediaTypeEssence('text/html;charset=utf-8')).to.equal('text/html')
    expect(mediaTypeEssence(' TEXT/HTML ')).to.equal('text/html')
    expect(mediaTypeEssence('image/svg+xml')).to.equal('image/svg+xml')
    expect(mediaTypeEssence('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')).to.equal('video/mp4')
    expect(mediaTypeEssence('not a type')).to.equal('')
    expect(mediaTypeEssence(null)).to.equal('')
  })
})

describe('isBlockedExternalUrl', () => {
  it('blocks javascript and vbscript with embedded whitespace or controls', () => {
    expect(isBlockedExternalUrl('javascript:alert(1)')).to.equal(true)
    expect(isBlockedExternalUrl('java\tscript:alert(1)')).to.equal(true)
    expect(isBlockedExternalUrl('java\nscript:alert(1)')).to.equal(true)
    expect(isBlockedExternalUrl('vbscript:msgbox(1)')).to.equal(true)
  })

  it('blocks data:, file:, custom OS schemes, and empty hrefs', () => {
    expect(isBlockedExternalUrl('data:text/html,<script>alert(1)</script>')).to.equal(true)
    expect(isBlockedExternalUrl('file:///etc/passwd')).to.equal(true)
    expect(isBlockedExternalUrl('ms-msdt:/id PCWDiagnostic')).to.equal(true)
    expect(isBlockedExternalUrl('smb://server/share')).to.equal(true)
    expect(isBlockedExternalUrl('')).to.equal(true)
  })

  it('allows http, https, and mailto links only', () => {
    expect(isBlockedExternalUrl('https://example.com')).to.equal(false)
    expect(isBlockedExternalUrl('http://example.com')).to.equal(false)
    expect(isBlockedExternalUrl('mailto:author@example.com')).to.equal(false)
  })
})

describe('sanitizeEbookDocument', () => {
  it('strips script before head and injects a CSP meta for canonical XHTML', async () => {
    const input = `<html xmlns="http://www.w3.org/1999/xhtml"><script>${MARKER}</script><head></head><body><p>hi</p></body></html>`
    const result = await sanitizeEbookDocument(input, 'application/xhtml+xml')
    expect(result).to.not.equal(null)
    expect(result!.data).to.not.include('<script')
    expect(result!.data).to.include('Content-Security-Policy')
    expect(result!.data).to.include('<p>hi</p>')
    expect(await loadInSandboxedIframe(result!.data, result!.type)).to.equal(false)
  })

  it('removes html onload handlers', async () => {
    const input = `<!DOCTYPE html><html onload="${MARKER}"><head></head><body>ok</body></html>`
    const result = await sanitizeEbookDocument(input, 'text/html')
    expect(result).to.not.equal(null)
    expect(result!.data.toLowerCase()).to.not.include('onload')
    expect(await loadInSandboxedIframe(result!.data, result!.type)).to.equal(false)
  })

  it('sanitizes text/html;charset=utf-8 Blobs', async () => {
    const blob = new Blob([`<html><head></head><body><script>${MARKER}</script><p>chapter</p></body></html>`], {
      type: 'text/html;charset=utf-8'
    })
    const result = await sanitizeEbookDocument(blob, 'text/html;charset=utf-8')
    expect(result).to.not.equal(null)
    expect(result!.type).to.equal('text/html;charset=utf-8')
    expect(result!.data).to.not.include('<script')
    expect(result!.data).to.include('chapter')
    expect(await loadInSandboxedIframe(result!.data, result!.type)).to.equal(false)
  })

  it('forces canonical UTF-8 instead of echoing non-UTF-8 charset parameters or meta tags', async () => {
    const input = `<html><head><meta charset="utf-16le"><meta http-equiv="content-type" content="text/html; charset=iso-2022-jp"></head><body><script>${MARKER}</script><p>safe</p></body></html>`
    const result = await sanitizeEbookDocument(input, 'text/html;charset=utf-16be')
    expect(result).to.not.equal(null)
    expect(result!.type).to.equal('text/html;charset=utf-8')
    expect(result!.data.toLowerCase()).to.not.include('utf-16')
    expect(result!.data.toLowerCase()).to.not.include('iso-2022-jp')
    expect(result!.data).to.include('safe')
    expect(await loadInSandboxedIframe(result!.data, result!.type)).to.equal(false)
  })

  it('sanitizes TEXT/HTML casing', async () => {
    const result = await sanitizeEbookDocument(`<html><body><script>${MARKER}</script>x</body></html>`, 'TEXT/HTML')
    expect(result).to.not.equal(null)
    expect(result!.data).to.not.include('<script')
    expect(await loadInSandboxedIframe(result!.data, result!.type)).to.equal(false)
  })

  it('strips SVG script, onload, foreignObject script, and animate/set javascript hrefs including custom prefixes', async () => {
    const input = `
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xl="http://www.w3.org/1999/xlink" onload="${MARKER}">
        <script>${MARKER}</script>
        <foreignObject width="100" height="100">
          <body xmlns="http://www.w3.org/1999/xhtml"><script>${MARKER}</script></body>
        </foreignObject>
        <a href="javascript:${MARKER}"><text>link</text></a>
        <set attributeName="href" to="javascript:${MARKER}" />
        <animate attributeName="xl:href" to="chapter2.xhtml" />
        <set attributeName="onclick" to="${MARKER}" />
        <circle cx="10" cy="10" r="5" />
      </svg>`
    const result = await sanitizeEbookDocument(input, 'image/svg+xml')
    expect(result).to.not.equal(null)
    expect(result!.type).to.equal('image/svg+xml')
    expect(result!.data.toLowerCase()).to.not.include('<script')
    expect(result!.data.toLowerCase()).to.not.include('onload')
    expect(result!.data.toLowerCase()).to.not.include('javascript:')
    expect(result!.data.toLowerCase()).to.not.include('<animate')
    expect(result!.data.toLowerCase()).to.not.include('<set')
    expect(result!.data).to.include('circle')
    expect(await loadInSandboxedIframe(result!.data, result!.type)).to.equal(false)
  })

  it('sanitizes generic XML and *+xml documents containing namespaced XHTML/SVG script', async () => {
    const xmlWithScript = `<?xml version="1.0"?><chapter><script xmlns="http://www.w3.org/1999/xhtml">${MARKER}</script><p>body</p></chapter>`
    for (const mime of ['application/xml', 'text/xml']) {
      const xmlResult = await sanitizeEbookDocument(xmlWithScript, mime)
      expect(xmlResult).to.not.equal(null)
      expect(xmlResult!.data).to.not.include('<script')
      expect(xmlResult!.data).to.include('<p>body</p>')
      expect(await loadInSandboxedIframe(xmlResult!.data, xmlResult!.type)).to.equal(false)
    }

    const xslResult = await sanitizeEbookDocument(xmlWithScript, 'text/xsl')
    expect(xslResult).to.not.equal(null)
    expect(xslResult!.type).to.equal('application/xml')
    expect(xslResult!.data).to.not.include('<script')
  })

  it('preserves valid SMIL +xml structure and media type while stripping embedded scripts', async () => {
    const smil = `<?xml version="1.0"?><smil xmlns="http://www.w3.org/ns/SMIL"><body><seq><par id="p1"/></seq></body></smil>`
    const cleanSmil = await sanitizeEbookDocument(smil, 'application/smil+xml')
    expect(cleanSmil).to.not.equal(null)
    expect(cleanSmil!.type).to.equal('application/smil+xml')
    expect(cleanSmil!.data).to.include('par id="p1"')

    const poisonedSmil = `<?xml version="1.0"?><smil xmlns="http://www.w3.org/ns/SMIL"><body><script xmlns="http://www.w3.org/1999/xhtml">${MARKER}</script><seq/></body></smil>`
    const sanitizedPoisoned = await sanitizeEbookDocument(poisonedSmil, 'application/smil+xml')
    expect(sanitizedPoisoned).to.not.equal(null)
    expect(sanitizedPoisoned!.type).to.equal('application/smil+xml')
    expect(sanitizedPoisoned!.data).to.not.include('<script')
    const parsed = new DOMParser().parseFromString(sanitizedPoisoned!.data, 'application/xml')
    expect(parsed.getElementsByTagName('parsererror')).to.have.length(0)
    expect(parsed.getElementsByTagName('script')).to.have.length(0)
    expect(parsed.getElementsByTagName('seq')).to.have.length(1)
  })

  it('strips javascript: hrefs, unparameterized scriptable data: URLs, and srcset candidates', async () => {
    const input = `<html><body>
      <a href="java\tscript:${MARKER}">x</a>
      <a href="java\nscript:${MARKER}">y</a>
      <a href="data:text/html,<script>${MARKER}</script>">h</a>
      <img src="data:image/svg+xml,<svg onload=${MARKER}/>">
      <img src="data:image/png;base64,AAAA" id="keep-png">
      <img srcset="ok.png 1x, javascript:${MARKER} 2x">
    </body></html>`
    const result = await sanitizeEbookDocument(input, 'text/html')
    expect(result).to.not.equal(null)
    expect(result!.data.toLowerCase()).to.not.match(/href\s*=\s*["']?java/)
    expect(result!.data.toLowerCase()).to.not.include('data:text/html')
    expect(result!.data.toLowerCase()).to.not.include('data:image/svg+xml')
    expect(result!.data).to.include('data:image/png;base64,AAAA')
    expect(result!.data.toLowerCase()).to.not.include('srcset')
    expect(await loadInSandboxedIframe(result!.data, result!.type)).to.equal(false)
  })

  it('keeps only blob: xml-stylesheet instructions and drops remote or relative ones', async () => {
    const input = `<?xml-stylesheet href="evil.xsl" title="type=text/css"?><?xml-stylesheet type="text/css" href="javascript:alert(1)"?><?xml-stylesheet type="text/css" href="style.css"?><?xml-stylesheet type="text/css" href="https://tracker.example/x.css"?><?xml-stylesheet type="text/css" href="//tracker.example/y.css"?><?xml-stylesheet type="text/css" href="blob:https://example.com/sheet"?><?xml-stylesheet type="text/css"?><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="refresh" content="0;url=https://evil.example"/><link rel="modulepreload" href="app.js"/><link rel="stylesheet" href="ok.css"/></head><body>ok</body></html>`
    const result = await sanitizeEbookDocument(input, 'application/xhtml+xml')
    expect(result).to.not.equal(null)
    expect(result!.data).to.not.include('evil.xsl')
    expect(result!.data).to.not.include('javascript:alert(1)')
    expect(result!.data).to.not.include('style.css')
    expect(result!.data).to.not.include('tracker.example')
    expect(result!.data).to.not.include('modulepreload')
    expect(result!.data).to.include('blob:https://example.com/sheet')
    expect(result!.data).to.include('<?xml-stylesheet type="text/css"?>')
    expect(result!.data).to.not.include('ok.css')
    expect(result!.data.toLowerCase()).to.not.include('http-equiv="refresh"')
  })

  it('drops links that are not a stylesheet or an icon', async () => {
    const input = `<html xmlns="http://www.w3.org/1999/xhtml"><head>
      <link rel="preconnect" href="https://tracker.example"/>
      <link rel="dns-prefetch" href="//tracker.example"/>
      <link rel="modulepreload" href="app.js"/>
      <link rel="preload" as="script" href="worker.js"/>
      <link rel="stylesheet" href="chapter.css"/>
      <link rel="stylesheet" href="https://tracker.example/remote.css"/>
      <link rel="stylesheet" href="data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;"/>
      <link rel="stylesheet" href="blob:https://example.com/sheet"/>
      <link rel="stylesheet" href="data:text/css,body{color:red}"/>
      <link rel="StyleSheet" href="bl ob:https://example.com/obfuscated"/>
      <link rel="icon" href="favicon.png"/>
      <link rel="shortcut icon" href="blob:https://example.com/icon"/>
      <link rel="icon" href="https://tracker.example/icon.png"/>
    </head><body>ok</body></html>`
    const result = await sanitizeEbookDocument(input, 'application/xhtml+xml')
    expect(result).to.not.equal(null)
    expect(result!.data).to.not.include('tracker.example')
    expect(result!.data).to.not.include('chapter.css')
    expect(result!.data).to.not.include('app.js')
    expect(result!.data).to.not.include('worker.js')
    expect(result!.data).to.not.include('preconnect')
    expect(result!.data).to.not.include('dns-prefetch')
    expect(result!.data).to.not.include('modulepreload')
    expect(result!.data).to.not.include('data:text/html')

    const doc = new DOMParser().parseFromString(result!.data, 'application/xhtml+xml')
    const links = Array.from(doc.getElementsByTagName('link'))
    const hrefs = links.map((link) => link.getAttribute('href'))
    expect(hrefs).to.include('blob:https://example.com/sheet')
    expect(hrefs).to.include('data:text/css,body{color:red}')
    expect(hrefs).to.include('bl ob:https://example.com/obfuscated')
    expect(hrefs).to.include('favicon.png')
    expect(hrefs).to.include('blob:https://example.com/icon')
    expect(links.some((link) => link.getAttribute('rel')?.toLowerCase() === 'icon' && !link.getAttribute('href'))).to.equal(true)
  })

  it('drops connection-hint and remote stylesheet links from SVG', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><link rel="dns-prefetch" href="//tracker.example"/><link rel="stylesheet" href="https://tracker.example/x.css"/><link rel="stylesheet" href="blob:https://example.com/sheet"/><circle r="4"/></svg>`
    const result = await sanitizeEbookDocument(svg, 'image/svg+xml')
    expect(result).to.not.equal(null)
    expect(result!.data).to.not.include('tracker.example')
    expect(result!.data).to.not.include('dns-prefetch')
    expect(result!.data).to.include('blob:https://example.com/sheet')
    expect(result!.data).to.include('<circle')
  })

  it('removes SVG animations that set srcdoc or use from/by script URLs', async () => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg"><set attributeName="srcdoc" to="&lt;script&gt;${MARKER}&lt;/script&gt;"/><animate attributeName="x" from="javascript:${MARKER}" to="0"/><circle r="4"/></svg>`
    const result = await sanitizeEbookDocument(input, 'image/svg+xml')
    expect(result).to.not.equal(null)
    expect(result!.data.toLowerCase()).to.not.include('<set')
    expect(result!.data.toLowerCase()).to.not.include('<animate')
    expect(result!.data).to.include('<circle')
  })

  it('replaces unparsable SVG or XML with an empty document', async () => {
    const svgResult = await sanitizeEbookDocument('<svg><<<<<<<', 'image/svg+xml')
    expect(svgResult).to.not.equal(null)
    expect(svgResult!.data).to.include('<svg')
    expect(svgResult!.data).to.not.include('<<<<<<')

    const xmlResult = await sanitizeEbookDocument('<root><unclosed></root>', 'application/xml')
    expect(xmlResult).to.deep.equal({ data: '<empty/>', type: 'application/xml' })
  })

  it('passes PNG Blobs and CSS strings through unchanged', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const pngBlob = new Blob([png], { type: 'image/png' })
    expect(await sanitizeEbookDocument(pngBlob, 'image/png')).to.equal(null)

    const css = 'body { color: red; } /* script: none */'
    expect(await sanitizeEbookDocument(css, 'text/css')).to.equal(null)
  })

  it('keeps style, inline SVG, and safe hrefs in a normal chapter', async () => {
    const input = `<!DOCTYPE html><html><head><style>.x{color:blue}</style></head><body>
      <p class="x"><a href="chapter2.xhtml">next</a></p>
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle cx="5" cy="5" r="4"/></svg>
    </body></html>`
    const result = await sanitizeEbookDocument(input, 'text/html')
    expect(result).to.not.equal(null)
    expect(result!.data).to.include('<style')
    expect(result!.data).to.include('color:blue')
    expect(result!.data).to.include('href="chapter2.xhtml"')
    expect(result!.data).to.include('<circle')
    expect(result!.data).to.include('Content-Security-Policy')
  })

  it('blocks remote images, fonts, and connections in the chapter CSP', async () => {
    const result = await sanitizeEbookDocument(
      '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body><img src="https://tracker.example/pixel"/></body></html>',
      'application/xhtml+xml'
    )
    expect(result).to.not.equal(null)
    const doc = new DOMParser().parseFromString(result!.data, 'application/xhtml+xml')
    const meta = Array.from(doc.getElementsByTagName('meta')).find((el) => el.getAttribute('http-equiv') === 'Content-Security-Policy')
    expect(meta?.getAttribute('content')).to.equal(DOCUMENT_CSP)
    expect(DOCUMENT_CSP).to.not.include("'self'")
    expect(DOCUMENT_CSP).to.not.include('http')
    expect(result!.data).to.not.include('tracker.example')
  })

  it('drops remote subresource URLs and keeps http(s) book links', async () => {
    const input = `<html><body>
      <a href="https://publisher.example/book">site</a>
      <a href="mailto:author@example.com">mail</a>
      <a href="chapter2.xhtml">next</a>
      <a href="https://publisher.example/book" ping="https://tracker.example/ping">ping</a>
      <img src="https://tracker.example/pixel.png">
      <img src="//tracker.example/pixel.png">
      <img src="ht\ttps://tracker.example/obfuscated.png">
      <img src="cover.jpg" srcset="cover.jpg 1x, https://tracker.example/a.png 2x, //tracker.example/b.png 3x">
      <p style="color:red;background:url(https://tracker.example/bg.png)">x</p>
      <p style="background:url('https://tracker.example/quoted.png');color:green">y</p>
      <div style="@import &quot;https://tracker.example/x.css&quot;;color:blue">z</div>
    </body></html>`
    const result = await sanitizeEbookDocument(input, 'text/html')
    expect(result).to.not.equal(null)
    expect(result!.data).to.include('href="https://publisher.example/book"')
    expect(result!.data).to.include('href="mailto:author@example.com"')
    expect(result!.data).to.include('href="chapter2.xhtml"')
    expect(result!.data).to.include('src="cover.jpg"')
    expect(result!.data).to.include('cover.jpg 1x')
    expect(result!.data).to.include('color:red')
    expect(result!.data).to.include('color:green')
    expect(result!.data).to.include('color:blue')
    expect(result!.data.toLowerCase()).to.not.include('tracker.example')
    expect(result!.data.toLowerCase()).to.not.include('ping=')
  })

  it('strips remote SVG image hrefs and style-block urls', async () => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg">
      <style>circle { fill: url(https://tracker.example/paint.png) }</style>
      <image href="https://tracker.example/svg.png" width="1" height="1"/>
      <a href="https://publisher.example/book"><text>site</text></a>
    </svg>`
    const result = await sanitizeEbookDocument(input, 'image/svg+xml')
    expect(result).to.not.equal(null)
    expect(result!.type).to.equal('image/svg+xml')
    expect(result!.data).to.include('width="1"')
    expect(result!.data).to.include('https://publisher.example/book')
    expect(result!.data).to.not.include('tracker.example')
  })

  it('removes denylist elements and walks template contents', async () => {
    const html = `<html><head><base href="https://tracker.example/"></head><body>
      <iframe src="https://tracker.example/iframe"></iframe>
      <object data="https://tracker.example/object"></object>
      <embed src="https://tracker.example/embed">
      <portal src="https://tracker.example/portal"></portal>
      <handler></handler>
      <listener></listener>
      <noscript><p>fallback</p></noscript>
      <template><script>${MARKER}</script><iframe src="https://tracker.example/in-template"></iframe><p>kept</p></template>
      <p>chapter</p>
    </body></html>`
    const htmlResult = await sanitizeEbookDocument(html, 'text/html')
    expect(htmlResult).to.not.equal(null)
    for (const tag of ['iframe', 'object', 'embed', 'portal', 'base', 'handler', 'listener', 'script', 'noscript']) {
      expect(htmlResult!.data.toLowerCase()).to.not.include(`<${tag}`)
    }
    expect(htmlResult!.data).to.include('<template')
    expect(htmlResult!.data).to.include('<p>kept</p>')
    expect(htmlResult!.data).to.include('<p>chapter</p>')
    expect(htmlResult!.data).to.not.include('fallback')
    expect(htmlResult!.data.toLowerCase()).to.not.include('tracker.example')

    // The HTML parser drops frame in body, so only an XHTML parse leaves the element for the walker.
    const xhtml = `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body><frame src="https://tracker.example/frame"></frame><p>chapter</p></body></html>`
    const xhtmlResult = await sanitizeEbookDocument(xhtml, 'application/xhtml+xml')
    expect(xhtmlResult).to.not.equal(null)
    expect(xhtmlResult!.data.toLowerCase()).to.not.include('<frame')
    expect(xhtmlResult!.data).to.include('<p>chapter</p>')
    expect(xhtmlResult!.data.toLowerCase()).to.not.include('tracker.example')
  })

  it('removes noscript so a closing tag inside style cannot reparse as an element', async () => {
    const input = `<!DOCTYPE html><html><head></head><body><p>chapter</p><noscript><style></noscript><img src="x" onerror="${MARKER}"></body></html>`
    expect(await loadInSandboxedIframe(input, 'text/html'), 'unsanitized noscript breakout runs').to.equal(true)

    const result = await sanitizeEbookDocument(input, 'text/html')
    expect(result).to.not.equal(null)
    expect(result!.data.toLowerCase()).to.not.include('<noscript')
    expect(result!.data.toLowerCase()).to.not.include('onerror')
    expect(result!.data).to.include('<p>chapter</p>')
    expect(await loadInSandboxedIframe(result!.data, result!.type)).to.equal(false)
  })

  it('reparses namespace-less or invalid XHTML as HTML before the root check', async () => {
    const namespaceLess = `<html><head></head><body><p>recovered</p><script>${MARKER}</script></body></html>`
    const invalid = `<html xmlns="http://www.w3.org/1999/xhtml"><body><p>recovered</p><script>${MARKER}</script>`

    for (const input of [namespaceLess, invalid]) {
      const result = await sanitizeEbookDocument(input, 'application/xhtml+xml')
      expect(result).to.not.equal(null)
      expect(result!.type).to.equal('text/html;charset=utf-8')
      expect(result!.data).to.include('<p>recovered</p>')
      expect(result!.data).to.not.include('<script')
      expect(result!.data).to.include('Content-Security-Policy')
      expect(await loadInSandboxedIframe(result!.data, result!.type)).to.equal(false)
    }
  })

  it('replaces an XHTML document whose root is not html with an empty XHTML document', async () => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg"><image href="https://tracker.example/svg.png" width="1" height="1"/></svg>`
    const result = await sanitizeEbookDocument(input, 'application/xhtml+xml')
    expect(result).to.deep.equal({
      data: '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body></body></html>',
      type: 'application/xhtml+xml'
    })
  })

  it('strips remote image src from generic XML', async () => {
    const input = `<?xml version="1.0"?><chapter><img xmlns="http://www.w3.org/1999/xhtml" src="https://tracker.example/pixel.png"/><p>body</p></chapter>`
    const result = await sanitizeEbookDocument(input, 'application/xml')
    expect(result).to.not.equal(null)
    expect(result!.type).to.equal('application/xml')
    expect(result!.data).to.include('<p>body</p>')
    expect(result!.data).to.not.include('tracker.example')
  })

  it('puts the CSP meta in the XHTML namespace', async () => {
    const result = await sanitizeEbookDocument('<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body><p>ok</p></body></html>', 'application/xhtml+xml')
    expect(result).to.not.equal(null)
    const doc = new DOMParser().parseFromString(result!.data, 'application/xhtml+xml')
    const meta = Array.from(doc.getElementsByTagName('meta')).find((el) => el.getAttribute('http-equiv') === 'Content-Security-Policy')
    expect(meta?.namespaceURI).to.equal('http://www.w3.org/1999/xhtml')
    expect(meta?.parentElement?.namespaceURI).to.equal('http://www.w3.org/1999/xhtml')
  })

  it('prepends an XHTML head when the existing head is in the null namespace', async () => {
    const input = `<html xmlns="http://www.w3.org/1999/xhtml"><head xmlns=""><title>t</title></head><body><img src="https://tracker.example/pixel.png"/></body></html>`
    const result = await sanitizeEbookDocument(input, 'application/xhtml+xml')
    expect(result).to.not.equal(null)
    const doc = new DOMParser().parseFromString(result!.data, 'application/xhtml+xml')
    const head = doc.documentElement?.firstElementChild
    expect(head?.namespaceURI).to.equal('http://www.w3.org/1999/xhtml')
    expect(head?.localName).to.equal('head')
    const meta = head?.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'meta')[0]
    expect(meta?.getAttribute('http-equiv')).to.equal('Content-Security-Policy')
    expect(meta?.getAttribute('content')).to.equal(DOCUMENT_CSP)
    const title = doc.getElementsByTagName('title')[0]
    expect(title?.textContent).to.equal('t')
    expect(title?.parentElement?.namespaceURI).to.equal(null)
    expect(result!.data).to.not.include('tracker.example')
  })

  it('does not request an image when the head is in the null namespace', () => {
    const input = `<html xmlns="http://www.w3.org/1999/xhtml"><head xmlns=""><title>t</title></head><body><img src="https://tracker.example/pixel.png"/></body></html>`
    expectSanitizedDocumentDoesNotRequestTracker(input, 'application/xhtml+xml')
  })

  it('does not request an SVG image with an https href', () => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg"><image href="https://tracker.example/svg.png" width="1" height="1"/></svg>`
    expectSanitizedDocumentDoesNotRequestTracker(input, 'image/svg+xml')
  })

  it('does not request an external xml-stylesheet', () => {
    const input = `<?xml-stylesheet type="text/css" href="https://tracker.example/x.css"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>t</title></head><body>x</body></html>`
    expectSanitizedDocumentDoesNotRequestTracker(input, 'application/xhtml+xml')
  })

  it('sets the probe from a script in an unsanitized document', async () => {
    const input = `<!DOCTYPE html><html><head></head><body><script>${MARKER}</script></body></html>`
    expect(await loadInSandboxedIframe(input, 'text/html')).to.equal(true)
  })
})

describe('attachEpubSecurity data hook', () => {
  async function runDataHook(data: string | Blob, type: string) {
    const transformTarget = new EventTarget()
    const view = Object.assign(new EventTarget(), { book: { transformTarget } }) as unknown as FoliateViewElement
    const detach = attachEpubSecurity(view)
    const detail: { data: string | Blob | Promise<string | Blob>; type?: string } = { data, type }
    transformTarget.dispatchEvent(new CustomEvent('data', { detail }))
    const result = await Promise.resolve(detail.data)
    detach()
    return { data: result, type: detail.type }
  }

  it('serves unrecognized and missing types as plain text without rewriting the bytes', async () => {
    const payload = '<script>alert(1)</script>'
    for (const type of ['application/x-unknown', 'foo', '']) {
      const result = await runDataHook(payload, type)
      expect(result.type).to.equal('text/plain')
      expect(result.data).to.equal(payload)
    }
  })

  it('keeps inert resources on their original type and sanitizes SMIL +xml', async () => {
    const png = await runDataHook('png-bytes', 'image/png')
    expect(png.type).to.equal('image/png')
    expect(png.data).to.equal('png-bytes')

    const css = await runDataHook('p { color: red }', 'text/css')
    expect(css.type).to.equal('text/css')

    const octet = await runDataHook('binary', 'application/octet-stream')
    expect(octet.type).to.equal('application/octet-stream')

    const smil = `<?xml version="1.0"?><smil xmlns="http://www.w3.org/ns/SMIL"><body><script xmlns="http://www.w3.org/1999/xhtml">${MARKER}</script><seq/></body></smil>`
    const overlay = await runDataHook(smil, 'application/smil+xml')
    expect(overlay.type).to.equal('application/smil+xml')
    expect(overlay.data as string).to.not.include('<script')
    expect(overlay.data as string).to.include('<seq/>')
  })

  it('cancels external-link events for non-allowlisted schemes on both href_ and href details', () => {
    const view = Object.assign(new EventTarget(), {}) as unknown as FoliateViewElement
    const detach = attachEpubSecurity(view)

    const blockedHrefUnderscore = new CustomEvent('external-link', { detail: { href_: 'file:///etc/passwd' }, cancelable: true })
    view.dispatchEvent(blockedHrefUnderscore)
    expect(blockedHrefUnderscore.defaultPrevented).to.equal(true)

    const blockedHref = new CustomEvent('external-link', { detail: { href: 'javascript:alert(1)' }, cancelable: true })
    view.dispatchEvent(blockedHref)
    expect(blockedHref.defaultPrevented).to.equal(true)

    const allowedHttps = new CustomEvent('external-link', { detail: { href_: 'https://example.com' }, cancelable: true })
    view.dispatchEvent(allowedHttps)
    expect(allowedHttps.defaultPrevented).to.equal(false)

    detach()
  })
})
