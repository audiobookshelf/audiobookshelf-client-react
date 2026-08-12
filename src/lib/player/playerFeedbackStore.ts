export type PlayerJumpDirection = 'forward' | 'backward'

export interface PlayerJumpEvent {
  direction: PlayerJumpDirection
  /** Configured jump amount in seconds */
  amount: number
}

type PlayerJumpListener = (event: PlayerJumpEvent) => void

const jumpListeners = new Set<PlayerJumpListener>()

/**
 * Announce a jump so views can show transient feedback for it.
 * Emitted from the player handler rather than the call sites so hotkeys,
 * transport buttons and media session controls all raise the same event.
 */
export function emitPlayerJump(event: PlayerJumpEvent): void {
  jumpListeners.forEach((listener) => listener(event))
}

export function subscribePlayerJump(listener: PlayerJumpListener): () => void {
  jumpListeners.add(listener)
  return () => {
    jumpListeners.delete(listener)
  }
}
