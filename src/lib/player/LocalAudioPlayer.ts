import type { LibraryItem } from '@/types/api'
import { PlayerState } from '@/types/api'
import Hls from 'hls.js'
import type { AudioTrack } from './AudioTrack'
import { AUDIO_MIME_TYPES } from './constants'

type PlayerEventMap = {
  stateChange: PlayerState
  timeupdate: number
  buffertimeUpdate: number
  durationChange: number
  error: Error
  finished: void
}

type PlayerEventCallback<K extends keyof PlayerEventMap> = (data: PlayerEventMap[K]) => void

type EventListeners = {
  [K in keyof PlayerEventMap]?: Set<PlayerEventCallback<K>>
}

/**
 * HTML5 Audio Player with HLS support
 * Manages audio playback for both direct play and HLS transcoded streams
 */
export class LocalAudioPlayer {
  private player: HTMLAudioElement | null = null
  private hlsInstance: Hls | null = null
  private listeners: EventListeners = {}

  // Track state
  private libraryItem: LibraryItem | null = null
  private audioTracks: AudioTrack[] = []
  private currentTrackIndex = 0
  private isHlsTranscode = false
  private startTime = 0
  private trackStartTime = 0
  private playWhenReady = false
  private defaultPlaybackRate = 1
  private defaultVolume = 1

  // Supported MIME types (detected on init)
  readonly playableMimeTypes: string[] = []

  constructor() {
    this.initialize()
  }

  private get currentTrack(): AudioTrack | null {
    return this.audioTracks[this.currentTrackIndex] ?? null
  }

  /**
   * Initialize the audio element and detect supported MIME types
   */
  private initialize(): void {
    // Remove existing player if any
    const existing = document.getElementById('audio-player')
    if (existing) {
      existing.remove()
    }

    // Create new audio element
    const audioEl = document.createElement('audio')
    audioEl.id = 'audio-player'
    audioEl.style.display = 'none'
    document.body.appendChild(audioEl)
    this.player = audioEl

    // Set up event listeners
    this.player.addEventListener('play', this.handlePlay)
    this.player.addEventListener('pause', this.handlePause)
    this.player.addEventListener('progress', this.handleProgress)
    this.player.addEventListener('ended', this.handleEnded)
    this.player.addEventListener('error', this.handleError)
    this.player.addEventListener('loadedmetadata', this.handleLoadedMetadata)
    this.player.addEventListener('timeupdate', this.handleTimeUpdate)

    // Detect supported MIME types
    for (const mimeType of AUDIO_MIME_TYPES) {
      const canPlay = this.player.canPlayType(mimeType)
      if (canPlay) {
        this.playableMimeTypes.push(mimeType)
      }
    }

    console.log('[LocalAudioPlayer] Initialized with supported MIME types:', this.playableMimeTypes)
  }

  // Event emitter methods
  on<K extends keyof PlayerEventMap>(event: K, callback: PlayerEventCallback<K>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set<PlayerEventCallback<keyof PlayerEventMap>>()
    }
    this.listeners[event]!.add(callback as PlayerEventCallback<keyof PlayerEventMap>)
  }

  off<K extends keyof PlayerEventMap>(event: K, callback: PlayerEventCallback<K>): void {
    this.listeners[event]?.delete(callback as PlayerEventCallback<keyof PlayerEventMap>)
  }

  private emit<K extends keyof PlayerEventMap>(event: K, data: PlayerEventMap[K]): void {
    this.listeners[event]?.forEach((callback) => {
      ;(callback as PlayerEventCallback<K>)(data)
    })
  }

  // Event handlers (arrow functions for correct 'this' binding)
  private handlePlay = (): void => {
    this.emit('stateChange', PlayerState.PLAYING)
  }

  private handlePause = (): void => {
    this.emit('stateChange', PlayerState.PAUSED)
  }

  private handleProgress = (): void => {
    const lastBufferTime = this.getLastBufferedTime()
    this.emit('buffertimeUpdate', lastBufferTime)
  }

  private handleEnded = (): void => {
    if (this.currentTrackIndex < this.audioTracks.length - 1) {
      // Has next track - load it
      console.log(`[LocalAudioPlayer] Track ended - loading next track ${this.currentTrackIndex + 1}`)
      this.currentTrackIndex++
      this.startTime = this.currentTrack?.startOffset ?? 0
      this.loadCurrentTrack()
    } else {
      // Finished all tracks
      console.log('[LocalAudioPlayer] Playback finished')
      this.emit('stateChange', PlayerState.FINISHED)
      this.emit('finished', undefined)
    }
  }

  private handleError = (event: Event): void => {
    const error = new Error('Audio playback error')
    console.error('[LocalAudioPlayer] Error:', event)
    this.emit('stateChange', PlayerState.ERROR)
    this.emit('error', error)
  }

  private handleLoadedMetadata = (): void => {
    if (!this.isHlsTranscode && this.player) {
      this.player.currentTime = this.trackStartTime
    }

    this.emit('stateChange', PlayerState.LOADED)
    this.emit('durationChange', this.getDuration())

    if (this.playWhenReady) {
      this.playWhenReady = false
      this.play()
    }
  }

  private handleTimeUpdate = (): void => {
    // Only emit during pause to avoid too frequent updates
    // The interval in PlayerHandler handles updates during playback
    if (this.player?.paused) {
      this.emit('timeupdate', this.getCurrentTime())
    }
  }

  /**
   * Set up the player with tracks and start time
   */
  set(libraryItem: LibraryItem, tracks: AudioTrack[], isHlsTranscode: boolean, startTime: number, playWhenReady = false): void {
    this.libraryItem = libraryItem
    this.audioTracks = tracks
    this.isHlsTranscode = isHlsTranscode
    this.playWhenReady = playWhenReady
    this.startTime = startTime

    // Clean up any existing HLS instance
    this.destroyHlsInstance()

    if (this.isHlsTranscode) {
      this.setHlsStream()
    } else {
      this.setDirectPlay()
    }
  }

  /**
   * Set up HLS streaming
   */
  private setHlsStream(): void {
    this.trackStartTime = 0
    this.currentTrackIndex = 0

    if (!this.currentTrack || !this.player) return

    // iOS doesn't support MSE but has native HLS support
    if (!Hls.isSupported()) {
      console.warn('[LocalAudioPlayer] HLS.js not supported - using native player')
      this.player.src = this.currentTrack.relativeContentUrl
      this.player.currentTime = this.startTime
      return
    }

    const hlsOptions: Partial<Hls['config']> = {
      startPosition: this.startTime || -1,
      fragLoadPolicy: {
        default: {
          maxTimeToFirstByteMs: 10000,
          maxLoadTimeMs: 120000,
          timeoutRetry: {
            maxNumRetry: 4,
            retryDelayMs: 0,
            maxRetryDelayMs: 0
          },
          errorRetry: {
            maxNumRetry: 8,
            retryDelayMs: 1000,
            maxRetryDelayMs: 8000,
            shouldRetry: (retryConfig, retryCount, _isTimeout, httpStatus, retry) => {
              // Retry on 404 (fragment not yet ready)
              if (httpStatus?.code === 404 && (retryConfig?.maxNumRetry ?? 0) > retryCount) {
                console.log(`[HLS] Server 404 for fragment - retry ${retryCount} of ${retryConfig?.maxNumRetry}`)
                return true
              }
              return retry
            }
          }
        }
      }
    }

    this.hlsInstance = new Hls(hlsOptions)
    this.hlsInstance.attachMedia(this.player)

    this.hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
      if (!this.hlsInstance || !this.currentTrack) return

      this.hlsInstance.loadSource(this.currentTrack.relativeContentUrl)

      this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[HLS] Manifest parsed')
      })

      this.hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          console.error('[HLS] Buffer stalled error')
        } else if (data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR) {
          // Only log if not retrying
          if (data.errorAction?.action !== 5) {
            console.error('[HLS] Fragment load error', data)
          }
        } else {
          console.error('[HLS] Error:', data.type, data.details, data)
        }
      })

      this.hlsInstance.on(Hls.Events.DESTROYING, () => {
        console.log('[HLS] Destroying instance')
      })
    })
  }

  /**
   * Set up direct play (no transcoding)
   */
  private setDirectPlay(): void {
    // Find the track that contains the start time
    const trackIndex = this.audioTracks.findIndex((track) => track.containsTime(this.startTime))

    this.currentTrackIndex = trackIndex >= 0 ? trackIndex : 0
    this.loadCurrentTrack()
  }

  /**
   * Load the current track into the audio element
   */
  private loadCurrentTrack(): void {
    const track = this.currentTrack
    if (!track || !this.player) return

    // Calculate time offset within the track
    this.trackStartTime = Math.max(0, this.startTime - track.startOffset)
    this.player.src = track.relativeContentUrl

    console.log(`[LocalAudioPlayer] Loading track: ${track.relativeContentUrl}`)
    this.player.load()
  }

  /**
   * Clean up HLS instance
   */
  private destroyHlsInstance(): void {
    if (this.hlsInstance?.destroy) {
      this.hlsInstance.destroy()
    }
    this.hlsInstance = null
  }

  /**
   * Completely destroy the player
   */
  destroy(): void {
    this.destroyHlsInstance()

    if (this.player) {
      this.player.removeEventListener('play', this.handlePlay)
      this.player.removeEventListener('pause', this.handlePause)
      this.player.removeEventListener('progress', this.handleProgress)
      this.player.removeEventListener('ended', this.handleEnded)
      this.player.removeEventListener('error', this.handleError)
      this.player.removeEventListener('loadedmetadata', this.handleLoadedMetadata)
      this.player.removeEventListener('timeupdate', this.handleTimeUpdate)
      this.player.remove()
      this.player = null
    }

    this.listeners = {}
    this.audioTracks = []
    this.libraryItem = null
  }

  /**
   * Reset and reload the stream (used on error to switch to HLS)
   */
  async resetStream(startTime: number): Promise<void> {
    this.destroyHlsInstance()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (this.libraryItem) {
      this.set(this.libraryItem, this.audioTracks, this.isHlsTranscode, startTime, true)
    }
  }

  // Playback controls

  playPause(): void {
    if (!this.player) return
    if (this.player.paused) {
      this.play()
    } else {
      this.pause()
    }
  }

  play(): void {
    this.playWhenReady = true
    this.player?.play()
  }

  pause(): void {
    this.playWhenReady = false
    this.player?.pause()
  }

  /**
   * Get current global playback time (across all tracks)
   */
  getCurrentTime(): number {
    const trackOffset = this.currentTrack?.startOffset ?? 0
    return this.player ? trackOffset + this.player.currentTime : 0
  }

  /**
   * Get total duration (sum of all tracks)
   */
  getDuration(): number {
    if (!this.audioTracks.length) return 0
    const lastTrack = this.audioTracks[this.audioTracks.length - 1]
    return lastTrack.startOffset + lastTrack.duration
  }

  setPlaybackRate(rate: number): void {
    this.defaultPlaybackRate = rate
    if (this.player) {
      this.player.playbackRate = rate
    }
  }

  setVolume(volume: number): void {
    this.defaultVolume = volume
    if (this.player) {
      this.player.volume = volume
    }
  }

  /**
   * Seek to a global time position
   */
  seek(time: number, playWhenReady: boolean): void {
    if (!this.player) return

    this.playWhenReady = playWhenReady

    if (this.isHlsTranscode) {
      // HLS: just seek within the stream
      const offsetTime = time - (this.currentTrack?.startOffset ?? 0)
      this.player.currentTime = Math.max(0, offsetTime)
    } else {
      // Direct play: may need to switch tracks
      const currentTrack = this.currentTrack
      if (!currentTrack) return

      if (time < currentTrack.startOffset || time > currentTrack.startOffset + currentTrack.duration) {
        // Need to change track
        const trackIndex = this.audioTracks.findIndex((t) => t.containsTime(time))
        if (trackIndex >= 0) {
          this.startTime = time
          this.currentTrackIndex = trackIndex

          if (!this.player.paused) {
            this.playWhenReady = true
          }
          this.loadCurrentTrack()
        }
      } else {
        // Seek within current track
        const offsetTime = time - currentTrack.startOffset
        this.player.currentTime = Math.max(0, offsetTime)
      }
    }
  }

  // Buffering utilities

  private isValidDuration(duration: number): boolean {
    return duration != null && !isNaN(duration) && duration !== Infinity && duration !== -Infinity
  }

  private getBufferedRanges(): Array<{ start: number; end: number }> {
    if (!this.player) return []

    const ranges: Array<{ start: number; end: number }> = []
    const buffered = this.player.buffered

    for (let i = 0; i < buffered.length; i++) {
      let start = buffered.start(i)
      const end = buffered.end(i)

      if (!this.isValidDuration(start)) start = 0
      if (!this.isValidDuration(end)) continue

      ranges.push({ start, end })
    }

    return ranges
  }

  private getLastBufferedTime(): number {
    const ranges = this.getBufferedRanges()
    if (!ranges.length || !this.player) return 0

    // Find the range that contains current time
    const currentRange = ranges.find((r) => r.start < this.player!.currentTime && r.end > this.player!.currentTime)

    if (currentRange) return currentRange.end

    // Return end of last range
    return ranges[ranges.length - 1].end
  }
}
