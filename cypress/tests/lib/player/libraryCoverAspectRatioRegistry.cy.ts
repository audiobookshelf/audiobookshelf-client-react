import { getRegisteredLibraryCoverAspectRatio, registerLibraryCoverAspectRatio } from '@/lib/player/libraryCoverAspectRatioRegistry'

describe('libraryCoverAspectRatioRegistry', () => {
  it('returns standard (1.6) for unregistered libraries', () => {
    expect(getRegisteredLibraryCoverAspectRatio('unknown-library')).to.equal(1.6)
  })

  it('stores square and standard settings per library', () => {
    registerLibraryCoverAspectRatio('lib-square', 1)
    registerLibraryCoverAspectRatio('lib-standard', 0)

    expect(getRegisteredLibraryCoverAspectRatio('lib-square')).to.equal(1)
    expect(getRegisteredLibraryCoverAspectRatio('lib-standard')).to.equal(1.6)
  })
})
