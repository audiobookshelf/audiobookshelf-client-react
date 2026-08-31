import { buildFoliateUserStyles, DEFAULT_EREADER_SETTINGS, type EreaderSettings } from '@/lib/ereader/ereaderSettings'

function stylesFor(patch: Partial<EreaderSettings> = {}) {
  return buildFoliateUserStyles({ ...DEFAULT_EREADER_SETTINGS, ...patch })
}

function lineHeightDeclaration(css: string) {
  const match = css.match(/line-height:\s*([^;]+);/)
  expect(match, 'expected a line-height declaration').to.not.equal(null)
  return match![1].trim()
}

describe('buildFoliateUserStyles', () => {
  it('uses a unitless line-height from the default spacing, not rem', () => {
    const css = stylesFor()
    expect(lineHeightDeclaration(css)).to.equal('1.15 !important')
    expect(css).to.not.include('rem')
    expect(css).to.include('font-size: 100%;')
  })

  it('keeps line-height independent of font scale', () => {
    const css = stylesFor({ fontScale: 200 })
    expect(css).to.include('font-size: 200%;')
    expect(lineHeightDeclaration(css)).to.equal('1.15 !important')
    expect(css).to.not.include('2.3rem')
  })

  it('scales line-height with the spacing setting regardless of font scale', () => {
    expect(lineHeightDeclaration(stylesFor({ lineSpacing: 150 }))).to.equal('1.5 !important')
    expect(lineHeightDeclaration(stylesFor({ lineSpacing: 150, fontScale: 200 }))).to.equal('1.5 !important')
    expect(lineHeightDeclaration(stylesFor({ lineSpacing: 150, fontScale: 300 }))).to.equal('1.5 !important')
  })
})
