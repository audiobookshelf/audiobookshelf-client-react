import { isAbsModalOpen } from '@/components/modals/Modal'
import type { PlayerHandlerControls, PlayerHandlerState } from '@/hooks/usePlayerHandler'
import { VOLUME_HOTKEY_STEP } from '@/lib/player/constants'
import { useEffect, useRef } from 'react'

const OPEN_COMBOBOX_SELECTOR = '[role="combobox"][aria-expanded="true"]'

/**
 * Registers keyboard hotkeys for the audio player.
 * Disabled while streaming is off, an input has focus, a modal is open, or a combobox menu is open.
 */
export function useAudioPlayerHotkeys(state: PlayerHandlerState, controls: PlayerHandlerControls, enabled: boolean, onClose: () => void) {
  const volumeRef = useRef(state.volume)
  volumeRef.current = state.volume

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

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

    function shouldIgnoreHotkeys(): boolean {
      return isInputFocused() || isAbsModalOpen() || document.querySelector(OPEN_COMBOBOX_SELECTOR) !== null
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (shouldIgnoreHotkeys()) return

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
          controls.setVolume(Math.min(volumeRef.current + VOLUME_HOTKEY_STEP, 1))
          break
        case 'ArrowDown':
          controls.setVolume(Math.max(volumeRef.current - VOLUME_HOTKEY_STEP, 0))
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
          onCloseRef.current()
          break
        default:
          return // Don't preventDefault for unhandled keys
      }

      e.preventDefault()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, controls])
}
