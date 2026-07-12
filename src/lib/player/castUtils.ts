import type { AudioTrack } from '@/lib/player/AudioTrack'
import { isBookMetadata, isPodcastLibraryItem, type LibraryItem } from '@/types/api'

function getMediaInfoFromTrack(libraryItem: LibraryItem, castImage: chrome.cast.Image, track: AudioTrack) {
  if (isPodcastLibraryItem(libraryItem)) {
    const metadata = new chrome.cast.media.MusicTrackMediaMetadata()
    metadata.albumArtist = libraryItem.media.metadata.author
    metadata.artist = libraryItem.media.metadata.author
    metadata.title = track.title
    metadata.albumName = libraryItem.media.metadata.title
    metadata.images = [castImage]

    const mediainfo = new chrome.cast.media.MediaInfo(track.fullContentUrl, track.mimeType)
    mediainfo.metadata = metadata
    mediainfo.itemId = track.index
    mediainfo.duration = track.duration
    return mediainfo
  }

  const metadata = new chrome.cast.media.AudiobookChapterMediaMetadata()
  metadata.bookTitle = libraryItem.media.metadata.title
  metadata.chapterNumber = track.index
  metadata.chapterTitle = track.title
  metadata.images = [castImage]
  metadata.title = track.title
  metadata.subtitle = libraryItem.media.metadata.title

  const mediainfo = new chrome.cast.media.MediaInfo(track.fullContentUrl, track.mimeType)
  mediainfo.metadata = metadata
  mediainfo.itemId = track.index
  mediainfo.duration = track.duration
  return mediainfo
}

function buildCastMediaInfo(libraryItem: LibraryItem, coverUrl: string, tracks: AudioTrack[]) {
  const castImage = new chrome.cast.Image(coverUrl)
  return tracks.map((track) => getMediaInfoFromTrack(libraryItem, castImage, track))
}

function buildCastQueueRequest(libraryItem: LibraryItem, coverUrl: string, tracks: AudioTrack[], startTime: number) {
  const mediaInfoItems = buildCastMediaInfo(libraryItem, coverUrl, tracks)

  let containerMetadata: chrome.cast.media.AudiobookContainerMetadata | chrome.cast.media.ContainerMetadata
  let queueType = chrome.cast.media.QueueType.AUDIOBOOK

  if (isPodcastLibraryItem(libraryItem)) {
    queueType = chrome.cast.media.QueueType.PODCAST_SERIES
    containerMetadata = new chrome.cast.media.ContainerMetadata(chrome.cast.media.ContainerType.GENERIC_CONTAINER)
    containerMetadata.title = libraryItem.media.metadata.title
  } else {
    const bookContainerMetadata = new chrome.cast.media.AudiobookContainerMetadata()
    const bookMetadata = isBookMetadata(libraryItem.media.metadata) ? libraryItem.media.metadata : null
    bookContainerMetadata.authors = bookMetadata?.authors?.map((author) => author.name)
    bookContainerMetadata.narrators = bookMetadata?.narrators ?? []
    bookContainerMetadata.publisher = bookMetadata?.publisher || undefined
    bookContainerMetadata.title = libraryItem.media.metadata.title
    containerMetadata = bookContainerMetadata
  }

  const mediaQueueItems = mediaInfoItems.map((mediaInfo) => new chrome.cast.media.QueueItem(mediaInfo))

  const track = tracks.find((audioTrack) => audioTrack.startOffset <= startTime && audioTrack.startOffset + audioTrack.duration > startTime)
  const trackStartIndex = track ? track.index - 1 : 0
  const trackStartTime = Math.floor(track ? startTime - track.startOffset : 0)

  const queueData = new chrome.cast.media.QueueData(
    libraryItem.id,
    libraryItem.media.metadata.title ?? '',
    '',
    false,
    mediaQueueItems,
    trackStartIndex,
    trackStartTime
  )
  queueData.containerMetadata = containerMetadata
  queueData.queueType = queueType
  return queueData
}

export function castLoadMedia(castSession: cast.framework.CastSession, request: chrome.cast.media.LoadRequest): Promise<boolean> {
  return new Promise((resolve) => {
    castSession.loadMedia(request).then(
      () => resolve(true),
      (reason) => {
        console.error('[CastPlayer] Load media failed', reason)
        resolve(false)
      }
    )
  })
}

export function buildCastLoadRequest(
  libraryItem: LibraryItem,
  coverUrl: string,
  tracks: AudioTrack[],
  startTime: number,
  autoplay: boolean,
  playbackRate: number
) {
  const request = new chrome.cast.media.LoadRequest()

  request.queueData = buildCastQueueRequest(libraryItem, coverUrl, tracks, startTime)
  request.currentTime = request.queueData.startTime
  request.autoplay = autoplay
  request.playbackRate = playbackRate
  return request
}
