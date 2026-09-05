'use client'

import { PLAYER_SWIPE_THRESHOLD_PX } from '@/lib/player/coverFit'
import {
  isPlayerShellSwipeBlockedTarget,
  PLAYER_SWIPE_THRESHOLD_MINI_PX,
  resolvePlayerShellSwipeAction,
  shouldLockPlayerShellSwipe,
  type PlayerShellSwipeAction
} from '@/lib/player/playerShellSwipe'
import { RefObject, useEffect, useRef } from 'react'

interface UsePlayerShellSwipeOptions {
  isPlayerFullscreen: boolean
  onExpand: () => void
  onCollapse: () => void
  onClose: () => void
  onSwipeHandled: () => void
}

export function usePlayerShellSwipe(shellRef: RefObject<HTMLDivElement | null>, options: UsePlayerShellSwipeOptions) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    let startX: number | null = null
    let startY: number | null = null
    let blocked = false
    let lockedVertical = false

    const reset = () => {
      startX = null
      startY = null
      blocked = false
      lockedVertical = false
    }

    const runAction = (action: PlayerShellSwipeAction) => {
      const { onExpand, onCollapse, onClose, onSwipeHandled } = optionsRef.current
      onSwipeHandled()
      if (action === 'expand') onExpand()
      else if (action === 'collapse') onCollapse()
      else onClose()
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        reset()
        return
      }

      blocked = isPlayerShellSwipeBlockedTarget(event.target)
      if (blocked) {
        startX = null
        startY = null
        lockedVertical = false
        return
      }

      startX = event.touches[0].clientX
      startY = event.touches[0].clientY
      lockedVertical = false
    }

    const onTouchMove = (event: TouchEvent) => {
      if (blocked || startX == null || startY == null || event.touches.length !== 1) return

      const dx = event.touches[0].clientX - startX
      const dy = event.touches[0].clientY - startY

      if (!lockedVertical && shouldLockPlayerShellSwipe(dx, dy)) {
        lockedVertical = true
      }

      if (lockedVertical) {
        event.preventDefault()
      }
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (blocked || startX == null || startY == null) {
        reset()
        return
      }

      const endX = event.changedTouches[0]?.clientX
      const endY = event.changedTouches[0]?.clientY
      const gestureStartX = startX
      const gestureStartY = startY
      reset()

      if (endX == null || endY == null) return

      const dx = endX - gestureStartX
      const dy = endY - gestureStartY
      const { isPlayerFullscreen } = optionsRef.current
      const action = resolvePlayerShellSwipeAction(dy, dx, isPlayerFullscreen, PLAYER_SWIPE_THRESHOLD_MINI_PX, PLAYER_SWIPE_THRESHOLD_PX)

      if (!action) return

      event.preventDefault()
      runAction(action)
    }

    shell.addEventListener('touchstart', onTouchStart, { capture: true })
    shell.addEventListener('touchmove', onTouchMove, { capture: true, passive: false })
    shell.addEventListener('touchend', onTouchEnd, { capture: true })
    shell.addEventListener('touchcancel', reset, { capture: true })

    return () => {
      shell.removeEventListener('touchstart', onTouchStart, { capture: true })
      shell.removeEventListener('touchmove', onTouchMove, { capture: true })
      shell.removeEventListener('touchend', onTouchEnd, { capture: true })
      shell.removeEventListener('touchcancel', reset, { capture: true })
    }
  }, [shellRef])
}
