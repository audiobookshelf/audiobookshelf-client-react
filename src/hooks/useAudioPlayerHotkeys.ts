import { VOLUME_HOTKEY_STEP } from '@/lib/player/constants'
import type { PlayerHandlerControls, PlayerHandlerState } from '@/hooks/usePlayerHandler'
import { useEffect } from 'react'

/**
 * Registers keyboard hotkeys for the audio player.
 * Automatically disables when nothing is streaming or when an input element is focused.
 */
export function useAudioPlayerHotkeys(
  state: PlayerHandlerState,
  controls: PlayerHandlerControls,
  enabled: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!enabled) return

    function isInputFocused(): boolean {
      const el = document.activeElement
      if (!el) return false
      const tag = el.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
      if ((el as HTMLElement).isContentEditable) return true
      return false
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (isInputFocused()) return

      const key = e.shiftKey ? `Shift-${e.code}` : e.code

      switch (key) {
        case 'Space':
          controls.playPause()
          break
        case 'ArrowRight':
          controls.jumpForward()
          break
        case 'ArrowLeft':
          controls.jumpBackward()
          break
        case 'ArrowUp':
          controls.setVolume(Math.min(state.volume + VOLUME_HOTKEY_STEP, 1))
          break
        case 'ArrowDown':
          controls.setVolume(Math.max(state.volume - VOLUME_HOTKEY_STEP, 0))
          break
        case 'KeyM':
          controls.toggleMute()
          break
        case 'Shift-ArrowUp':
          controls.incrementPlaybackRate()
          break
        case 'Shift-ArrowDown':
          controls.decrementPlaybackRate()
          break
        case 'Escape':
          onClose()
          break
        default:
          return // Don't preventDefault for unhandled keys
      }

      e.preventDefault()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, state.volume, controls, onClose])
}
