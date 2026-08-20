import { buildManifest } from '@/lib/pwa/buildManifest'

describe('buildManifest', () => {
  it('root deploy: start_url/scope/icons are origin-absolute', () => {
    const manifest = buildManifest('')
    expect(manifest.start_url).to.equal('/')
    expect(manifest.scope).to.equal('/')
    expect((manifest.icons ?? []).map((i) => i.src)).to.deep.equal([
      '/images/icon.svg',
      '/images/icon192.png',
      '/images/icon512.png',
      '/images/icon-maskable.png'
    ])
  })

  it('subfolder deploy: every URL is prefixed with the base path', () => {
    const manifest = buildManifest('/some-directory')
    expect(manifest.start_url).to.equal('/some-directory/')
    expect(manifest.scope).to.equal('/some-directory/')
    for (const icon of manifest.icons ?? []) {
      expect(icon.src, icon.src).to.match(/^\/some-directory\/images\//)
    }
  })

  it('exposes an installable icon set (192, 512, and a maskable variant) and standalone display', () => {
    const manifest = buildManifest('')
    expect(manifest.display).to.equal('standalone')
    const purposeBySize = (manifest.icons ?? []).map((i) => `${i.sizes}:${i.purpose}`)
    expect(purposeBySize).to.include('192x192:any')
    expect(purposeBySize).to.include('512x512:any')
    expect(purposeBySize).to.include('512x512:maskable')
  })
})
