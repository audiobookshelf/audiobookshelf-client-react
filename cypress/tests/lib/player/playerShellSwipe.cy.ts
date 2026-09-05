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
    expect(resolvePlayerShellSwipeAction(-30, 0, false, PLAYER_SWIPE_THRESHOLD_MINI_PX, 100)).to.equal(null)
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

  it('blocks author row targets for shell swipes', () => {
    const authorRow = document.createElement('div')
    authorRow.className = 'player-author'
    const text = document.createElement('span')
    text.textContent = 'Author Name'
    authorRow.append(text)
    expect(isPlayerShellSwipeBlockedTarget(text)).to.equal(true)
  })
})
