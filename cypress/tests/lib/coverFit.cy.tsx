import { fitCoverWidth, MAX_COVER_WIDTH, MIN_COVER_WIDTH } from '@/lib/player/coverFit'

const PORTRAIT_RATIO = 1.6
const SQUARE_RATIO = 1

describe('fitCoverWidth', () => {
  it('is limited by width on a narrow, tall stage', () => {
    // 390px phone, plenty of height: the artwork must not exceed the stage width
    expect(fitCoverWidth({ availableWidth: 350, availableHeight: 900, coverAspectRatio: PORTRAIT_RATIO })).to.equal(350)
  })

  it('is limited by height on a short, wide stage', () => {
    // Phone in landscape: 180px of height at a 1.6 ratio allows a 112px wide cover
    expect(fitCoverWidth({ availableWidth: 700, availableHeight: 180, coverAspectRatio: PORTRAIT_RATIO })).to.equal(112.5)
  })

  it('never exceeds the maximum', () => {
    expect(fitCoverWidth({ availableWidth: 2000, availableHeight: 2000, coverAspectRatio: PORTRAIT_RATIO })).to.equal(MAX_COVER_WIDTH)
  })

  it('falls back to the floor when the stage has not been measured yet', () => {
    expect(fitCoverWidth({ availableWidth: 0, availableHeight: 0, coverAspectRatio: PORTRAIT_RATIO })).to.equal(MIN_COVER_WIDTH)
  })

  it('never returns a negative width when the reserved space exceeds the stage', () => {
    expect(fitCoverWidth({ availableWidth: -40, availableHeight: -100, coverAspectRatio: PORTRAIT_RATIO })).to.equal(MIN_COVER_WIDTH)
  })

  it('handles square covers', () => {
    expect(fitCoverWidth({ availableWidth: 500, availableHeight: 300, coverAspectRatio: SQUARE_RATIO })).to.equal(300)
  })

  it('falls back to the floor for a nonsensical aspect ratio', () => {
    expect(fitCoverWidth({ availableWidth: 500, availableHeight: 500, coverAspectRatio: 0 })).to.equal(MIN_COVER_WIDTH)
    expect(fitCoverWidth({ availableWidth: 500, availableHeight: 500, coverAspectRatio: NaN })).to.equal(MIN_COVER_WIDTH)
  })
})
