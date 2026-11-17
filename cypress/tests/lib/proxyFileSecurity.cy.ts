import { getProxiedFileSecurityHeaders } from '@/lib/proxyFileSecurity'

function expectInline(contentType: string, expectedType = contentType) {
  const secured = getProxiedFileSecurityHeaders(contentType)
  expect(secured.inline).to.equal(true)
  expect(secured.contentType).to.equal(expectedType)
  expect(secured.headers['Content-Type']).to.equal(expectedType)
  expect(secured.headers['X-Content-Type-Options']).to.equal('nosniff')
  expect(secured.headers).to.not.have.property('Content-Disposition')
  expect(secured.headers).to.not.have.property('Content-Security-Policy')
}

function expectAttachment(contentType: string | null | undefined) {
  const secured = getProxiedFileSecurityHeaders(contentType)
  expect(secured.inline).to.equal(false)
  expect(secured.contentType).to.equal('application/octet-stream')
  expect(secured.headers).to.deep.equal({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment',
    'X-Content-Type-Options': 'nosniff'
  })
}

describe('getProxiedFileSecurityHeaders', () => {
  it('leaves images, audio, and video inline', () => {
    for (const contentType of ['image/png', 'image/jpeg', 'image/webp', 'audio/mpeg', 'audio/mp4', 'video/mp4']) {
      expectInline(contentType)
    }
  })

  it('keeps a parameterized image type inline and drops the parameters', () => {
    expectInline('image/jpeg; charset=binary', 'image/jpeg')
  })

  it('downloads active and non-media documents', () => {
    for (const contentType of [
      'image/svg+xml',
      'text/html',
      'text/html; charset=utf-8',
      'application/xhtml+xml',
      'text/xml',
      'application/pdf',
      'application/epub+zip'
    ]) {
      expectAttachment(contentType)
    }
  })

  it('downloads an empty or malformed content type', () => {
    expectAttachment(null)
    expectAttachment(undefined)
    expectAttachment('')
    expectAttachment('text/html\r\nX-Injected: 1')
    expectAttachment('image/png, text/html')
    expectAttachment('not a type')
  })
})
