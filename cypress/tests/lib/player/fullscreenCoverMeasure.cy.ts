import { coverWidthOverHeight, fitFullscreenCoverInRemainingSpace, measureFullscreenCoverMaxHeight } from '@/lib/player/fullscreenCoverMeasure'

describe('fullscreenCoverMeasure', () => {
  it('converts book aspect ratio to css width/height', () => {
    expect(coverWidthOverHeight(1.6)).to.be.closeTo(0.625, 0.001)
    expect(coverWidthOverHeight(1)).to.equal(1)
  })

  it('fits portrait fullscreen cover in space below measured controls', () => {
    const fitted = fitFullscreenCoverInRemainingSpace({
      shellWidth: 390,
      shellHeight: 700,
      aspectRatio: 1.6,
      isDesktop: false,
      isLandscapeCompact: false,
      chrome: { contentTopPx: 52, contentBottomPx: 12 },
      reservedBelowCoverPx: 280
    })

    expect(fitted.height).to.be.at.most(700 - 52 - 12 - 280)
    expect(fitted.width).to.be.at.most(390 - 32)
  })

  it('uses a smaller cover height when bottom safe-area is reserved', () => {
    const maxHeight = measureFullscreenCoverMaxHeight({
      shellHeight: 360,
      chrome: { contentTopPx: 52, contentBottomPx: 50 },
      reservedBelowCoverPx: 0
    })

    expect(maxHeight).to.equal(258)
  })

  it('uses the full landscape column height when controls sit beside the cover', () => {
    const maxHeight = measureFullscreenCoverMaxHeight({
      shellHeight: 360,
      chrome: { contentTopPx: 52, contentBottomPx: 16 },
      reservedBelowCoverPx: 0
    })

    expect(maxHeight).to.equal(292)

    const fitted = fitFullscreenCoverInRemainingSpace({
      shellWidth: 844,
      shellHeight: 360,
      aspectRatio: 1,
      isDesktop: false,
      isLandscapeCompact: true,
      chrome: { contentTopPx: 52, contentBottomPx: 16 },
      reservedBelowCoverPx: 0
    })

    expect(fitted.height).to.equal(292)
    expect(fitted.width).to.equal(292)
  })
})
