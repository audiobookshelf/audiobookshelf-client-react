import type { AudioTrackData } from '@/types/api'

/**
 * Represents an audio track with session-aware URLs
 */
export class AudioTrack {
  readonly index: number
  readonly startOffset: number
  readonly duration: number
  readonly title: string
  readonly contentUrl: string
  readonly mimeType: string
  readonly metadata: Record<string, unknown>

  private readonly sessionId: string
  private readonly sessionTrackUrl: string

  constructor(track: AudioTrackData, sessionId: string) {
    this.index = track.index ?? 0
    this.startOffset = track.startOffset ?? 0
    this.duration = track.duration ?? 0
    this.title = track.title ?? ''
    this.contentUrl = track.contentUrl ?? ''
    this.mimeType = track.mimeType ?? ''
    this.metadata = track.metadata ?? {}

    this.sessionId = sessionId

    // HLS streams use the content URL directly, direct play uses session track URL
    if (this.contentUrl?.startsWith('/hls')) {
      this.sessionTrackUrl = this.contentUrl
    } else {
      this.sessionTrackUrl = `/public/session/${sessionId}/track/${this.index}`
    }
  }

  /**
   * Full URL for external players (e.g., Chromecast)
   */
  get fullContentUrl(): string {
    return `${window.location.origin}${this.sessionTrackUrl}`
  }

  /**
   * Relative URL for local player
   */
  get relativeContentUrl(): string {
    return this.sessionTrackUrl
  }

  /**
   * Check if a given time falls within this track
   */
  containsTime(time: number): boolean {
    return time >= this.startOffset && time < this.startOffset + this.duration
  }
}
