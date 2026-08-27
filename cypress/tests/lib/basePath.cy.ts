import { BASE_PATH_ATTRIBUTE, BASE_PATH_PLACEHOLDER, getClientBasePath, normalizeBasePath, replaceBasePathPlaceholder, withBasePath } from '@/lib/basePath'

/** The browser reads the base path off the root element the server layout renders. */
function serveFrom(basePath: string | null) {
  if (basePath === null) {
    document.documentElement.removeAttribute(BASE_PATH_ATTRIBUTE)
  } else {
    document.documentElement.setAttribute(BASE_PATH_ATTRIBUTE, basePath)
  }
}

describe('normalizeBasePath', () => {
  it('treats empty, whitespace and "/" as a root deploy', () => {
    expect(normalizeBasePath('')).to.equal('')
    expect(normalizeBasePath('   ')).to.equal('')
    expect(normalizeBasePath('/')).to.equal('')
    expect(normalizeBasePath(null)).to.equal('')
    expect(normalizeBasePath(undefined)).to.equal('')
  })

  it('adds the leading slash and drops the trailing one', () => {
    expect(normalizeBasePath('audiobookshelf')).to.equal('/audiobookshelf')
    expect(normalizeBasePath('/audiobookshelf/')).to.equal('/audiobookshelf')
    expect(normalizeBasePath('  /audiobookshelf  ')).to.equal('/audiobookshelf')
  })

  it('keeps nested paths intact', () => {
    expect(normalizeBasePath('/media/abs/')).to.equal('/media/abs')
  })
})

describe('getClientBasePath', () => {
  afterEach(() => serveFrom(null))

  it('is empty when the root element carries no base path', () => {
    serveFrom(null)
    expect(getClientBasePath()).to.equal('')
  })

  it('normalizes whatever the layout rendered', () => {
    serveFrom('/audiobookshelf/')
    expect(getClientBasePath()).to.equal('/audiobookshelf')
  })
})

describe('withBasePath', () => {
  afterEach(() => serveFrom(null))

  it('returns root-relative urls unchanged on a root deploy', () => {
    serveFrom('')
    expect(withBasePath('/api/items/123/cover')).to.equal('/api/items/123/cover')
    expect(withBasePath('/login')).to.equal('/login')
  })

  it('prefixes root-relative urls on a subfolder deploy', () => {
    serveFrom('/abs')
    expect(withBasePath('/api/items/123/cover')).to.equal('/abs/api/items/123/cover')
    expect(withBasePath('/socket.io')).to.equal('/abs/socket.io')
    expect(withBasePath('/')).to.equal('/abs/')
  })

  it('keeps the query string and hash attached to the prefixed path', () => {
    serveFrom('/abs')
    expect(withBasePath('/library/1/items?filter=genres.abc#top')).to.equal('/abs/library/1/items?filter=genres.abc#top')
  })

  it('still prefixes a path that merely starts with the same characters', () => {
    serveFrom('/abs')
    expect(withBasePath('/absolute/path')).to.equal('/abs/absolute/path')
  })

  it('leaves absolute and protocol-relative urls alone', () => {
    serveFrom('/abs')
    expect(withBasePath('https://example.com/feed')).to.equal('https://example.com/feed')
    expect(withBasePath('//cdn.example.com/img.png')).to.equal('//cdn.example.com/img.png')
    expect(withBasePath('blob:https://example.com/1234')).to.equal('blob:https://example.com/1234')
  })
})

/**
 * These strings mirror the three shapes the placeholder takes in a production build: a plain
 * literal in client chunks, a regex-escaped path in route matchers, and that same regex escaped
 * again inside a JSON manifest.
 */
const PLAIN = `assetPrefix:"${BASE_PATH_PLACEHOLDER}"`
const REGEX_ESCAPED = `/^\\${BASE_PATH_PLACEHOLDER}/library$/`
const JSON_ESCAPED = `{"matcher":"^\\\\${BASE_PATH_PLACEHOLDER}/library$"}`

describe('replaceBasePathPlaceholder', () => {
  it('substitutes a nested path into a plain literal', () => {
    expect(replaceBasePathPlaceholder(PLAIN, '/abs')).to.equal('assetPrefix:"/abs"')
    expect(replaceBasePathPlaceholder(PLAIN, '/media/abs')).to.equal('assetPrefix:"/media/abs"')
  })

  it('removes the placeholder entirely for a root deploy', () => {
    expect(replaceBasePathPlaceholder(PLAIN, '')).to.equal('assetPrefix:""')
  })

  it('keeps regex escaping on each path segment', () => {
    expect(replaceBasePathPlaceholder(REGEX_ESCAPED, '/abs')).to.equal('/^\\/abs/library$/')
    expect(replaceBasePathPlaceholder(REGEX_ESCAPED, '/media/abs')).to.equal('/^\\/media\\/abs/library$/')
  })

  it('keeps JSON-escaped regex escaping on each path segment', () => {
    expect(replaceBasePathPlaceholder(JSON_ESCAPED, '/abs')).to.equal('{"matcher":"^\\\\/abs/library$"}')
    expect(replaceBasePathPlaceholder(JSON_ESCAPED, '/media/abs')).to.equal('{"matcher":"^\\\\/media\\\\/abs/library$"}')
  })

  it('drops the escaping along with the token on a root deploy, leaving a valid pattern', () => {
    // A stray backslash here is what produced "Unmatched )" errors from Next's route matcher.
    expect(replaceBasePathPlaceholder(REGEX_ESCAPED, '')).to.equal('/^/library$/')
    expect(replaceBasePathPlaceholder(JSON_ESCAPED, '')).to.equal('{"matcher":"^/library$"}')
    expect(JSON.parse(replaceBasePathPlaceholder(JSON_ESCAPED, '')).matcher).to.equal('^/library$')
  })

  it('replaces every occurrence in a chunk', () => {
    const chunk = `${BASE_PATH_PLACEHOLDER}/a|${BASE_PATH_PLACEHOLDER}/b|${BASE_PATH_PLACEHOLDER}/c`
    expect(replaceBasePathPlaceholder(chunk, '/abs')).to.equal('/abs/a|/abs/b|/abs/c')
    expect(replaceBasePathPlaceholder(chunk, '')).to.equal('/a|/b|/c')
  })

  it('leaves content without the placeholder untouched', () => {
    const untouched = 'const basePath = "/audiobookshelf"'
    expect(replaceBasePathPlaceholder(untouched, '/abs')).to.equal(untouched)
  })
})
