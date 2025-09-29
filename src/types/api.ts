// Base types for file metadata
export interface FileMetadata {
  filename: string
  ext: string
  path: string
  relPath: string
  size: number
  mtimeMs: number
  ctimeMs: number
  birthtimeMs: number
}

// Library file structure
export interface LibraryFile {
  ino: string
  metadata: FileMetadata
  isSupplementary: boolean | null
  addedAt: number
  updatedAt: number
  fileType?: 'image' | 'audio' | 'ebook' | 'text' | 'metadata' | 'unknown'
}

// Library settings structure
export interface LibrarySettings {
  coverAspectRatio: number
  disableWatcher: boolean
  skipMatchingMediaWithAsin?: boolean
  skipMatchingMediaWithIsbn?: boolean
  autoScanCronExpression?: string | null
  audiobooksOnly?: boolean
  hideSingleBookSeries?: boolean
  onlyShowLaterBooksInContinueSeries?: boolean
  metadataPrecedence?: string[]
  markAsFinishedTimeRemaining?: number
  markAsFinishedPercentComplete?: number | null
  podcastSearchRegion?: string
  epubsAllowScriptedContent?: boolean
}

// Library structure
export interface Library {
  id: string
  name: string
  displayOrder: number
  icon: string
  mediaType: 'book' | 'podcast'
  provider?: string
  lastScan?: number | null
  lastScanVersion?: string
  settings?: LibrarySettings
  extraData?: Record<string, any>
  createdAt: number
  updatedAt: number
  folders?: LibraryFolder[]
}

export interface LibraryFolder {
  id: string
  path: string
  libraryId: string
  createdAt: number
  updatedAt: number
}

// Audio file structure for books
export interface AudioFile {
  index: number
  ino: string
  metadata: FileMetadata
  addedAt: number
  updatedAt: number
  trackNumFromMeta: number
  discNumFromMeta: number
  trackNumFromFilename: number
  discNumFromFilename: number
  manuallyVerified: boolean
  format: string
  duration: number
  bitRate: number
  language: string
  codec: string
  timeBase: string
  channels: number
  channelLayout: string
  chapters: Chapter[]
  metaTags: AudioMetaTags
  mimeType: string
  exclude?: boolean
}

// Audio track structure for playback
export interface AudioTrack extends AudioFile {
  title: string
  contentUrl: string
  startOffset: number
}

// Chapter structure
export interface Chapter {
  id: number
  start: number
  end: number
  title: string
}

// E-book file structure
export interface EBookFile {
  ino: string
  ebookFormat: string
  addedAt: number
  updatedAt: number
  metadata: FileMetadata
}

// Author structure
export interface Author {
  id: string
  name: string
  nameIgnorePrefix?: string
  description?: string
  coverPath?: string
  relPath?: string
  addedAt?: number
  updatedAt?: number
}

export interface AuthorShort {
  id: string
  name: string
}

// Series structure
export interface Series {
  id: string
  name: string
  nameIgnorePrefix?: string
  description?: string
  coverPath?: string
  addedAt?: number
  updatedAt?: number
  bookSeries?: {
    sequence: string
  }
}

export interface SeriesShort {
  id: string
  name: string
  sequence: string
}

// Podcast episode structure
export interface PodcastEpisode {
  id: string
  libraryItemId: string
  podcastId: string
  title: string
  description?: string
  descriptionPlain?: string
  pubDate?: string
  publishedAt?: number
  addedAt: number
  updatedAt: number
  duration: number
  size: number
  audioFile?: AudioFile
  season?: number
  episode?: number
  episodeType?: string
  guid?: string
  explicit?: boolean
  order?: number
}

// Book metadata structure
export interface BookMetadata {
  title: string
  titleIgnorePrefix?: string
  subtitle?: string
  authors: AuthorShort[]
  narrators?: string[]
  series: SeriesShort[]
  genres?: string[]
  publishedYear?: string
  publishedDate?: string
  publisher?: string
  description?: string
  descriptionPlain?: string
  isbn?: string
  asin?: string
  language?: string
  explicit?: boolean
  abridged?: boolean
}

// Podcast metadata structure
export interface PodcastMetadata {
  title: string
  titleIgnorePrefix?: string
  author?: string
  description?: string
  descriptionPlain?: string
  releaseDate?: string
  genres?: string[]
  feedURL?: string
  imageURL?: string
  itunesPageURL?: string
  itunesId?: string
  itunesArtistId?: string
  language?: string
  explicit?: boolean
  podcastType?: string
}

// Media progress structure
export interface MediaProgress {
  id: string
  libraryItemId: string
  episodeId?: string
  duration: number
  progress: number
  currentTime: number
  isFinished: boolean
  hideFromContinueListening?: boolean
  ebookLocation?: string
  ebookProgress: number
  finishedAt?: number
  lastUpdate: number
  startedAt?: number
  lastPlayedAt?: number
  libraryId?: string
  mediaItemId?: string
  mediaItemType?: string
  userId?: string
}

// RSS Feed structure
export interface RssFeed {
  id: string
  slug: string
  entityType: 'book' | 'podcast'
  entityId: string
  feedUrl: string
  metaTitle?: string
  metaDescription?: string
  isPublic: boolean
  createdAt: number
  updatedAt: number
}

// Share structure
export interface MediaItemShare {
  id: string
  name: string
  slug: string
  userId: string
  libraryItemId: string
  mediaItemId: string
  isPublic: boolean
  expiresAt?: number
  createdAt: number
  updatedAt: number
}

// Podcast episode download structure
export interface PodcastEpisodeDownload {
  id: string
  episodeDisplayTitle?: string
  url: string
  libraryItemId: string
  libraryId?: string
  isFinished: boolean
  failed: boolean
  appendRandomId: boolean
  startedAt?: number
  createdAt: number
  finishedAt?: number
  podcastTitle?: string
  podcastExplicit?: boolean
  season?: number
  episode?: number
  episodeType?: string
  publishedAt?: number
  guid?: string
}

// Book media structure
export interface BookMedia {
  id: string
  libraryItemId: string
  metadata: BookMetadata
  coverPath?: string
  tags: string[]
  audioFiles: AudioFile[]
  chapters: Chapter[]
  ebookFile?: EBookFile
  duration?: number
  size?: number
  tracks?: AudioTrack[]
  numTracks?: number
  numAudioFiles?: number
  numChapters?: number
  ebookFormat?: string
}

// Podcast media structure
export interface PodcastMedia {
  id: string
  libraryItemId: string
  metadata: PodcastMetadata
  coverPath?: string
  tags: string[]
  episodes: PodcastEpisode[]
  autoDownloadEpisodes?: boolean
  autoDownloadSchedule?: string
  lastEpisodeCheck?: number
  maxEpisodesToKeep?: number
  maxNewEpisodesToDownload?: number
  size?: number
  numEpisodes?: number
}

// Audio metadata tags based on AudioMetaTags.js
export interface AudioMetaTags {
  tagAlbum?: string
  tagAlbumSort?: string
  tagArtist?: string
  tagArtistSort?: string
  tagGenre?: string
  tagTitle?: string
  tagTitleSort?: string
  tagSeries?: string
  tagSeriesPart?: string
  tagGrouping?: string
  tagTrack?: string
  tagDisc?: string
  tagSubtitle?: string
  tagAlbumArtist?: string
  tagDate?: string
  tagComposer?: string
  tagPublisher?: string
  tagComment?: string
  tagDescription?: string
  tagEncoder?: string
  tagEncodedBy?: string
  tagIsbn?: string
  tagLanguage?: string
  tagASIN?: string
  tagItunesId?: string
  tagPodcastType?: string
  tagEpisodeType?: string
  tagOverdriveMediaMarker?: string
  tagOriginalYear?: string
  tagReleaseCountry?: string
  tagReleaseType?: string
  tagReleaseStatus?: string
  tagISRC?: string
  tagMusicBrainzTrackId?: string
  tagMusicBrainzAlbumId?: string
  tagMusicBrainzAlbumArtistId?: string
  tagMusicBrainzArtistId?: string
}

// LibraryItem structure - includes all possible properties
// Additional properties are conditionally included based on query parameters
export interface LibraryItem {
  id: string
  ino: string
  oldLibraryItemId?: string
  libraryId: string
  folderId?: string
  path: string
  relPath: string
  isFile: boolean
  mtimeMs: number
  ctimeMs: number
  birthtimeMs: number
  addedAt: number
  updatedAt: number
  lastScan?: number
  scanVersion?: string
  isMissing: boolean
  isInvalid: boolean
  mediaType: 'book' | 'podcast'
  media: BookMedia | PodcastMedia
  libraryFiles: LibraryFile[]
  size?: number
  numFiles?: number

  // Optional additional data based on includeEntities query parameter
  userMediaProgress?: MediaProgress // included when include=progress
  rssFeed?: RssFeed // included when include=rssfeed
  mediaItemShare?: MediaItemShare // included when include=share
  episodeDownloadsQueued?: PodcastEpisodeDownload[] // included when include=downloads
  episodesDownloading?: PodcastEpisodeDownload[] // included when include=downloads
  numEpisodesIncomplete?: number // included in some contexts
}

export interface BookLibraryItem extends LibraryItem {
  mediaType: 'book'
  media: BookMedia
}

export interface PodcastLibraryItem extends LibraryItem {
  mediaType: 'podcast'
  media: PodcastMedia
}

// Request query parameters for LibraryItem endpoint
export interface LibraryItemQueryParams {
  include?: string // Comma-separated list: progress, rssfeed, share, downloads
  expanded?: number // 1 for expanded view
  episode?: string // Episode ID for progress
}

// Utility type to extract media type from LibraryItem
export type MediaType<T extends LibraryItem> = T['mediaType']

// Utility type to extract media based on type
export type MediaByType<T extends LibraryItem['mediaType']> = T extends 'book' ? BookMedia : T extends 'podcast' ? PodcastMedia : never

// Type guards
export function isBookMedia(media: BookMedia | PodcastMedia): media is BookMedia {
  return 'audioFiles' in media
}

export function isPodcastMedia(media: BookMedia | PodcastMedia): media is PodcastMedia {
  return 'episodes' in media
}

export function isBookLibraryItem(item: LibraryItem): item is BookLibraryItem {
  return item.mediaType === 'book'
}

export function isPodcastLibraryItem(item: LibraryItem): item is PodcastLibraryItem {
  return item.mediaType === 'podcast'
}
