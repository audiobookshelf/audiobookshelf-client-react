import {
  isPlayerShellSwipeBlockedTarget,
  PLAYER_SWIPE_LOCK_PX,
  PLAYER_SWIPE_THRESHOLD_MINI_PX,
  resolvePlayerShellSwipeAction,
  shouldLockPlayerShellHorizontalSeek,
  shouldLockPlayerShellSwipe
} from '@/lib/player/playerShellSwipe'

describe('playerShellSwipe', () => {
  it('resolves mini and fullscreen vertical swipes', () => {
    expect(resolvePlayerShellSwipeAction(-50, 0, false, PLAYER_SWIPE_THRESHOLD_MINI_PX, 100)).to.equal('expand')
    expect(resolvePlayerShellSwipeAction(50, 0, false, PLAYER_SWIPE_THRESHOLD_MINI_PX, 100)).to.equal('close')
    expect(resolvePlayerShellSwipeAction(100, 0, true, PLAYER_SWIPE_THRESHOLD_MINI_PX, 100)).to.equal('collapse')
    expect(resolvePlayerShellSwipeAction(-20, 0, false, PLAYER_SWIPE_THRESHOLD_MINI_PX, 100)).to.equal(null)
    expect(resolvePlayerShellSwipeAction(0, 60, false, PLAYER_SWIPE_THRESHOLD_MINI_PX, 100)).to.equal(null)
  })

  it('locks vertical swipes once movement is mostly vertical', () => {
    expect(shouldLockPlayerShellSwipe(0, PLAYER_SWIPE_LOCK_PX)).to.equal(true)
    expect(shouldLockPlayerShellSwipe(PLAYER_SWIPE_LOCK_PX, 0)).to.equal(false)
  })

  it('locks horizontal seek once movement is mostly horizontal', () => {
    expect(shouldLockPlayerShellHorizontalSeek(PLAYER_SWIPE_LOCK_PX, 0)).to.equal(true)
    expect(shouldLockPlayerShellHorizontalSeek(0, PLAYER_SWIPE_LOCK_PX)).to.equal(false)
  })

  it('does not block track bar slider targets for shell swipes', () => {
    const slider = document.createElement('div')
    slider.setAttribute('role', 'slider')
    expect(isPlayerShellSwipeBlockedTarget(slider)).to.equal(false)
  })

  it('does not block title, author, or control button targets for shell swipes', () => {
    const titleLink = document.createElement('a')
    titleLink.href = '/library/1/item/2'
    expect(isPlayerShellSwipeBlockedTarget(titleLink)).to.equal(false)

    const authorRow = document.createElement('div')
    authorRow.className = 'player-author'
    const authorLink = document.createElement('a')
    authorLink.href = '/library/1/authors/3'
    authorRow.append(authorLink)
    expect(isPlayerShellSwipeBlockedTarget(authorLink)).to.equal(false)

    const playButton = document.createElement('button')
    playButton.type = 'button'
    expect(isPlayerShellSwipeBlockedTarget(playButton)).to.equal(false)
  })
})
