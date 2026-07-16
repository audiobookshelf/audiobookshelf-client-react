import { useSyncExternalStore } from 'react'

/** Playback position snapshot */
export interface PlayerProgress {
  currentTime: number
  bufferedTime: number
}

let progress: PlayerProgress = { currentTime: 0, bufferedTime: 0 }
const listeners = new Set<() => void>()

export function getPlayerProgress(): PlayerProgress {
  return progress
}

function notifyProgressListeners(): void {
  listeners.forEach((listener) => listener())
}

export function setPlayerProgress(currentTime: number, bufferedTime: number): void {
  if (progress.currentTime === currentTime && progress.bufferedTime === bufferedTime) return
  progress = { currentTime, bufferedTime }
  notifyProgressListeners()
}

export function resetPlayerProgress(): void {
  if (progress.currentTime === 0 && progress.bufferedTime === 0) return
  progress = { currentTime: 0, bufferedTime: 0 }
  notifyProgressListeners()
}

export function subscribePlayerProgress(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Poll interval for reading player.getCurrentTime()   */
export const PLAYER_PROGRESS_POLL_MS = 250

/** Subscribe to playback position updates */
export function usePlayerProgress() {
  return useSyncExternalStore(subscribePlayerProgress, getPlayerProgress, getPlayerProgress)
}
