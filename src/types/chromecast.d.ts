/* Minimal Chromecast CAF sender types used by the web player. */

declare namespace chrome.cast {
  const AutoJoinPolicy: {
    ORIGIN_SCOPED: unknown
  }

  class Image {
    constructor(url: string)
  }

  namespace media {
    class MusicTrackMediaMetadata {
      albumArtist?: string
      artist?: string
      title?: string
      albumName?: string
      images?: Image[]
    }

    class AudiobookChapterMediaMetadata {
      bookTitle?: string
      chapterNumber?: number
      chapterTitle?: string
      images?: Image[]
      title?: string
      subtitle?: string
    }

    class AudiobookContainerMetadata {
      authors?: string[]
      narrators?: string[]
      publisher?: string
      title?: string
    }

    class ContainerMetadata {
      constructor(containerType: number)
      title?: string
    }

    const ContainerType: {
      GENERIC_CONTAINER: number
    }

    const QueueType: {
      AUDIOBOOK: string
      PODCAST_SERIES: string
    }

    class MediaInfo {
      constructor(contentId: string, contentType: string)
      metadata?: MusicTrackMediaMetadata | AudiobookChapterMediaMetadata
      itemId?: number
      duration?: number
    }

    class QueueItem {
      constructor(media: MediaInfo)
    }

    class QueueData {
      constructor(id: string, name: string, description: string, repeat: boolean, items: QueueItem[], startIndex: number, startTime: number)
      containerMetadata?: AudiobookContainerMetadata | ContainerMetadata
      queueType?: string
      startTime?: number
    }

    class LoadRequest {
      queueData?: QueueData
      currentTime?: number
      autoplay?: boolean
      playbackRate?: number
    }
  }
}

declare namespace cast.framework {
  class RemotePlayer {
    currentTime: number
    volumeLevel: number
  }

  class RemotePlayerController {
    constructor(player: RemotePlayer)
    addEventListener(eventType: string, handler: () => void): void
    playOrPause(): void
    seek(): void
    setVolumeLevel(): void
    stop(): void
  }

  const RemotePlayerEventType: {
    MEDIA_INFO_CHANGED: string
  }

  const CastContextEventType: {
    SESSION_STATE_CHANGED: string
  }

  const SessionState: {
    SESSION_STARTED: string
    SESSION_RESUMED: string
    SESSION_ENDED: string
  }

  class CastContext {
    static getInstance(): CastContext
    setOptions(options: { receiverApplicationId: string; autoJoinPolicy: unknown }): void
    addEventListener(eventType: string, handler: (event: { sessionState: string }) => void): void
    getCurrentSession(): CastSession | null
  }

  interface CastSession {
    getMediaSession(): CastMediaSession | null
    loadMedia(request: chrome.cast.media.LoadRequest): Promise<void>
    sendMessage(namespace: string, message: unknown): void
  }

  interface CastMediaSession {
    media: { itemId?: number }
    playerState: string
  }
}

interface Window {
  __onGCastApiAvailable?: (isAvailable: boolean) => void
  cast?: {
    framework: typeof cast.framework
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    'google-cast-launcher': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
  }
}
