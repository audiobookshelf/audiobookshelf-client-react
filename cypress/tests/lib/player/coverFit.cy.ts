import {
  fitCoverInBox,
  fitFullscreenCoverSize,
  fitLandscapeCompactLayout,
  isDesktopViewport,
  isLandscapeCompactViewport,
  LANDSCAPE_COMPACT_COL_MIN_WIDTH,
  LANDSCAPE_COMPACT_CONTENT_TOP,
  LANDSCAPE_COMPACT_INLINE_PADDING,
  measureDesktopFullscreenContentWidth,
  miniCoverSize,
  COVER_WIDTH_MINI_DESKTOP,
  COVER_WIDTH_MINI_MOBILE
} from '@/lib/player/coverFit'

describe('coverFit', () => {
  it('uses 56px mini covers on mobile and 77px on desktop', () => {
    expect(miniCoverSize(1, false)).to.deep.equal({ width: COVER_WIDTH_MINI_MOBILE, height: COVER_WIDTH_MINI_MOBILE })
    expect(miniCoverSize(1.6, false)).to.deep.equal({
      width: Math.round(COVER_WIDTH_MINI_MOBILE / 1.6),
      height: COVER_WIDTH_MINI_MOBILE
    })
    expect(miniCoverSize(1.6, true)).to.deep.equal({
      width: Math.round(COVER_WIDTH_MINI_DESKTOP / 1.6),
      height: COVER_WIDTH_MINI_DESKTOP
    })
  })

  it('fits a cover inside both axis limits', () => {
    const fitted = fitCoverInBox(200, 100, 1.6)
    expect(fitted.height).to.be.at.most(100)
    expect(fitted.width).to.be.at.most(200)
    expect(fitted.height / fitted.width).to.be.closeTo(1.6, 0.05)
  })

  it('treats 1024px as the desktop breakpoint', () => {
    expect(isDesktopViewport(1023)).to.equal(false)
    expect(isDesktopViewport(1024)).to.equal(true)
  })

  it('detects compact landscape viewports', () => {
    expect(isLandscapeCompactViewport(844, 390)).to.equal(true)
    expect(isLandscapeCompactViewport(390, 844)).to.equal(false)
    expect(isLandscapeCompactViewport(1920, 1080)).to.equal(false)
  })

  it('uses most of the viewport width on mobile portrait fullscreen', () => {
    const fitted = fitFullscreenCoverSize({
      viewportWidth: 390,
      viewportHeight: 844,
      aspectRatio: 1.6,
      isDesktop: false
    })
    expect(fitted.width).to.be.greaterThan(280)
    expect(fitted.width).to.be.at.most(390 - 32)
  })

  it('shrinks fullscreen cover so landscape phones do not clip', () => {
    const fitted = fitFullscreenCoverSize({
      viewportWidth: 844,
      viewportHeight: 390,
      aspectRatio: 1.6,
      isDesktop: false
    })
    const availW = 844 - LANDSCAPE_COMPACT_INLINE_PADDING * 3
    expect(fitted.width).to.be.at.most(availW - LANDSCAPE_COMPACT_COL_MIN_WIDTH)
    expect(fitted.height).to.be.at.most(390 - LANDSCAPE_COMPACT_CONTENT_TOP - LANDSCAPE_COMPACT_INLINE_PADDING)
  })

  it('uses a responsive landscape column width with a button-row minimum', () => {
    const wide = fitLandscapeCompactLayout({
      shellWidth: 844,
      shellHeight: 390,
      aspectRatio: 1.6,
      chrome: { contentTopPx: 52, contentBottomPx: 16 }
    })
    const wideAvailW = 844 - LANDSCAPE_COMPACT_INLINE_PADDING * 3
    expect(wide.columnWidth).to.equal(wideAvailW - wide.cover.width)
    expect(wide.columnWidth).to.be.greaterThan(LANDSCAPE_COMPACT_COL_MIN_WIDTH)

    const narrow = fitLandscapeCompactLayout({
      shellWidth: 550,
      shellHeight: 390,
      aspectRatio: 1.6,
      chrome: { contentTopPx: 52, contentBottomPx: 16 }
    })
    expect(narrow.columnWidth).to.be.at.least(LANDSCAPE_COMPACT_COL_MIN_WIDTH)
    expect(narrow.cover.height).to.be.at.most(390 - 52 - 16)
  })

  it('does not treat bottom safe-area as landscape side padding', () => {
    const layout = fitLandscapeCompactLayout({
      shellWidth: 640,
      shellHeight: 360,
      aspectRatio: 1.6,
      chrome: {
        contentTopPx: 52,
        contentBottomPx: 50,
        paddingInlineStartPx: 16,
        paddingInlineEndPx: 16,
        columnGapPx: 16
      }
    })
    const availW = 640 - LANDSCAPE_COMPACT_INLINE_PADDING * 3
    expect(layout.cover.width + layout.columnWidth).to.equal(availW)
    expect(layout.cover.height).to.be.at.most(360 - 52 - 50)
  })

  it('does not upscale beyond natural size', () => {
    const fitted = fitCoverInBox(800, 800, 1.6, { width: 200, height: 320 })
    expect(fitted.width).to.equal(200)
    expect(fitted.height).to.equal(320)
  })

  it('uses the library aspect ratio even when the image pixels differ', () => {
    const fitted = fitCoverInBox(800, 800, 1.6, { width: 240, height: 240 })
    expect(fitted.width).to.equal(150)
    expect(fitted.height).to.equal(240)
    expect(fitted.height / fitted.width).to.be.closeTo(1.6, 0.05)
  })

  it('matches desktop portrait controls width but not beyond natural size', () => {
    const contentWidth = measureDesktopFullscreenContentWidth(1920)

    const largeNatural = fitFullscreenCoverSize({
      viewportWidth: 1920,
      viewportHeight: 2000,
      aspectRatio: 1.6,
      isDesktop: true,
      naturalSize: { width: 2000, height: 3200 }
    })
    expect(largeNatural.width).to.equal(contentWidth)

    const heightLimited = fitFullscreenCoverSize({
      viewportWidth: 1920,
      viewportHeight: 1080,
      aspectRatio: 1.6,
      isDesktop: true,
      naturalSize: { width: 2000, height: 3200 }
    })
    expect(heightLimited.width).to.be.at.most(contentWidth)

    const smallNatural = fitFullscreenCoverSize({
      viewportWidth: 1920,
      viewportHeight: 1080,
      aspectRatio: 1.6,
      isDesktop: true,
      naturalSize: { width: 240, height: 384 }
    })
    expect(smallNatural.width).to.equal(240)
    expect(smallNatural.height).to.equal(384)
  })
})
