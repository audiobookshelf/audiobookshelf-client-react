import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import type { AudioTrack } from '@/lib/player/AudioTrack'
import { buildCastLoadRequest, castLoadMedia } from '@/lib/player/castUtils'
import type { LibraryItem } from '@/types/api'
import { PlayerState } from '@/types/api'

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

export interface CastRemotePlayerHandles {
  player: cast.framework.RemotePlayer
  controller: cast.framework.RemotePlayerController
}

function mapCastPlayerState(state: string): PlayerState {
  switch (state) {
    case 'PLAYING':
      return PlayerState.PLAYING
    case 'BUFFERING':
      return PlayerState.LOADING
    case 'IDLE':
      return PlayerState.IDLE
    case 'PAUSED':
    default:
      return PlayerState.PAUSED
  }
}

function getCastCoverUrl(libraryItem: LibraryItem): string {
  const coverImg = getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt, true)
  if (process.env.NODE_ENV === 'development') {
    return coverImg
  }
  return `${window.location.origin}${coverImg}`
}

/**
 * Chromecast remote player — mirrors Vue CastPlayer.js
 */
export class CastPlayer {
  private readonly remote: CastRemotePlayerHandles
  private listeners: EventListeners = {}

  private libraryItem: LibraryItem | null = null
  private audioTracks: AudioTrack[] = []
  private currentTrackIndex = 0
  private playWhenReady = false
  private defaultPlaybackRate = 1
  private coverUrl = ''
  private castPlayerState = 'IDLE'

  readonly playableMimeTypes = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/webm', 'audio/wav', 'audio/x-m4a']

  constructor(remote: CastRemotePlayerHandles) {
    this.remote = remote
    this.remote.controller.addEventListener(window.cast!.framework.RemotePlayerEventType.MEDIA_INFO_CHANGED, this.handleMediaInfoChanged)
  }

  private get currentTrack(): AudioTrack | undefined {
    return this.audioTracks[this.currentTrackIndex]
  }

  private handleMediaInfoChanged = (): void => {
    const session = window.cast?.framework.CastContext.getInstance().getCurrentSession()
    if (!session) return

    const media = session.getMediaSession()
    if (!media) return

    const currentItemId = media.media.itemId
    if (currentItemId && this.currentTrackIndex !== currentItemId - 1) {
      this.currentTrackIndex = currentItemId - 1
    }

    if (media.playerState !== this.castPlayerState) {
      this.emit('stateChange', mapCastPlayerState(media.playerState))
      this.castPlayerState = media.playerState
    }
  }

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

  destroy(): void {
    this.remote.controller.stop()
    this.listeners = {}
    this.audioTracks = []
    this.libraryItem = null
  }

  async set(libraryItem: LibraryItem, tracks: AudioTrack[], _isHlsTranscode: boolean, startTime: number, playWhenReady = false): Promise<void> {
    this.libraryItem = libraryItem
    this.audioTracks = tracks
    this.playWhenReady = playWhenReady
    this.coverUrl = getCastCoverUrl(libraryItem)

    const request = buildCastLoadRequest(libraryItem, this.coverUrl, tracks, startTime, playWhenReady, this.defaultPlaybackRate)
    const castSession = window.cast?.framework.CastContext.getInstance().getCurrentSession()
    if (!castSession) {
      throw new Error('No active cast session')
    }

    this.emit('stateChange', PlayerState.LOADING)
    const loaded = await castLoadMedia(castSession, request)
    if (!loaded) {
      this.emit('stateChange', PlayerState.ERROR)
      this.emit('error', new Error('Failed to load media on cast device'))
      return
    }

    this.emit('durationChange', this.getDuration())
    this.emit('stateChange', playWhenReady ? PlayerState.PLAYING : PlayerState.LOADED)
  }

  playPause(): void {
    this.remote.controller.playOrPause()
  }

  play(): void {
    this.remote.controller.playOrPause()
  }

  pause(): void {
    this.remote.controller.playOrPause()
  }

  getCurrentTime(): number {
    const currentTrackOffset = this.currentTrack?.startOffset ?? 0
    return currentTrackOffset + this.remote.player.currentTime
  }

  getDuration(): number {
    if (!this.audioTracks.length) return 0
    const lastTrack = this.audioTracks[this.audioTracks.length - 1]
    return lastTrack.startOffset + lastTrack.duration
  }

  setPlaybackRate(playbackRate: number): void {
    this.defaultPlaybackRate = playbackRate
  }

  async seek(time: number, playWhenReady: boolean): Promise<void> {
    this.playWhenReady = playWhenReady
    const currentTrack = this.currentTrack
    if (!currentTrack || !this.libraryItem) return

    if (time < currentTrack.startOffset || time > currentTrack.startOffset + currentTrack.duration) {
      const request = buildCastLoadRequest(this.libraryItem, this.coverUrl, this.audioTracks, time, playWhenReady, this.defaultPlaybackRate)
      const castSession = window.cast?.framework.CastContext.getInstance().getCurrentSession()
      if (!castSession) return
      await castLoadMedia(castSession, request)
      return
    }

    const offsetTime = time - (currentTrack.startOffset || 0)
    this.remote.player.currentTime = Math.max(0, offsetTime)
    this.remote.controller.seek()
  }

  setVolume(volume: number): void {
    this.remote.player.volumeLevel = volume
    this.remote.controller.setVolumeLevel()
  }
}
