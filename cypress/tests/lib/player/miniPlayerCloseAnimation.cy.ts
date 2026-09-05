import {
  getPlayerMiniCloseDurationMs,
  getPlayerMiniSlideDurationMs,
  isElementScrolledToBottom,
  pinMiniPlayerEnterInset,
  PLAYER_MINI_CLOSE_DUR_MS,
  PLAYER_MINI_SLIDE_DUR_MS
} from '@/lib/player/miniPlayerCloseAnimation'

describe('miniPlayerCloseAnimation', () => {
  it('uses a short slide duration by default', () => {
    expect(PLAYER_MINI_SLIDE_DUR_MS).to.equal(250)
    expect(PLAYER_MINI_CLOSE_DUR_MS).to.equal(PLAYER_MINI_SLIDE_DUR_MS)
    expect(getPlayerMiniSlideDurationMs()).to.equal(250)
    expect(getPlayerMiniCloseDurationMs()).to.equal(250)
  })

  it('pins the page inset to zero for mini player enter', () => {
    document.documentElement.style.setProperty('--media-player-height', '165px')
    pinMiniPlayerEnterInset()
    expect(document.documentElement.style.getPropertyValue('--media-player-height')).to.equal('0px')
    document.documentElement.style.removeProperty('--media-player-height')
  })

  it('detects when a scroller is at the bottom', () => {
    const atBottom = { scrollHeight: 400, clientHeight: 100, scrollTop: 300 } as HTMLElement
    expect(isElementScrolledToBottom(atBottom)).to.equal(true)

    const notAtBottom = { scrollHeight: 400, clientHeight: 100, scrollTop: 0 } as HTMLElement
    expect(isElementScrolledToBottom(notAtBottom)).to.equal(false)
  })
})
