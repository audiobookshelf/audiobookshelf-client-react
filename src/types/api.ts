// ============================================================================
// ENUMS
// ============================================================================

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

export enum AuthMethod {
  LOCAL = 'local',
  OPENID = 'openid'
}

export enum BookshelfView {
  STANDARD = 0, // Skeumorphic (original) design
  DETAIL = 1 // Modern default design
}

// ============================================================================
// SERVER & SYSTEM
// ============================================================================

// Server status interface
export interface ServerStatus {
  serverVersion: string
  language: string
  isInit: boolean
  authMethods: string[]
  authFormData: Record<string, unknown>
  ConfigPath: string
  MetadataPath: string
  app: string
}

// Server settings interface
export interface ServerSettings {
  // Scanner settings
  scannerParseSubtitle: boolean
  scannerFindCovers: boolean
  scannerCoverProvider: string
  scannerPreferMatchedMetadata: boolean
  scannerDisableWatcher: boolean

  // Metadata settings
  storeCoverWithItem: boolean
  storeMetadataWithItem: boolean
  metadataFileFormat: string

  // Security/Rate limits
  rateLimitLoginRequests: number
  rateLimitLoginWindow: number // in milliseconds
  allowIframe: boolean

  // Backups
  backupPath: string
  backupSchedule: string | false // Cron expression or false if disabled
  backupsToKeep: number
  maxBackupSize: number // in GB

  // Logger
  loggerDailyLogsToKeep: number
  loggerScannerLogsToKeep: number

  // Bookshelf Display
  homeBookshelfView: BookshelfView
  bookshelfView: BookshelfView

  // Podcasts
  podcastEpisodeSchedule: string // Cron expression

  // Sorting
  sortingIgnorePrefix: boolean
  sortingPrefixes: string[]

  // Misc Flags
  chromecastEnabled: boolean
  dateFormat: string
  timeFormat: string
  language: string
  allowedOrigins: string[]

  // System info
  logLevel: LogLevel
  version: string
  buildNumber: string

  // Auth settings
  authLoginCustomMessage?: string
  authActiveAuthMethods: AuthMethod[]
  authOpenIDIssuerURL?: string
  authOpenIDAuthorizationURL?: string
  authOpenIDTokenURL?: string
  authOpenIDUserInfoURL?: string
  authOpenIDJwksURL?: string
  authOpenIDLogoutURL?: string
  authOpenIDTokenSigningAlgorithm: string
  authOpenIDButtonText: string
  authOpenIDAutoLaunch: boolean
  authOpenIDAutoRegister: boolean
  authOpenIDMatchExistingBy?: string
  authOpenIDSubfolderForRedirectURLs?: string
}

// ============================================================================
// FILE SYSTEM
// ============================================================================

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

export interface LibraryFile {
  ino: string
  metadata: FileMetadata
  isSupplementary?: boolean
  addedAt: number
  updatedAt: number
  fileType?: 'image' | 'audio' | 'ebook' | 'text' | 'metadata' | 'unknown'
}

// ============================================================================
// LIBRARIES
// ============================================================================

export interface LibrarySettings {
  coverAspectRatio: number
  disableWatcher: boolean
  skipMatchingMediaWithAsin?: boolean
  skipMatchingMediaWithIsbn?: boolean
  autoScanCronExpression?: string
  audiobooksOnly?: boolean
  hideSingleBookSeries?: boolean
  onlyShowLaterBooksInContinueSeries?: boolean
  metadataPrecedence?: string[]
  markAsFinishedTimeRemaining?: number
  markAsFinishedPercentComplete?: number
  podcastSearchRegion?: string
  epubsAllowScriptedContent?: boolean
}

export interface Library {
  id: string
  name: string
  displayOrder: number
  icon: string
  mediaType: 'book' | 'podcast'
  provider?: string
  lastScan?: number
  lastScanVersion?: string
  settings?: LibrarySettings
  createdAt: number
  updatedAt: number
  folders?: LibraryFolder[]
}

export interface GetLibrariesResponse {
  libraries: Library[]
}

export interface GetUsersResponse {
  users: User[]
}

export interface LibraryFolder {
  id: string
  path: string
  libraryId: string
  createdAt: number
  updatedAt: number
}

// ============================================================================
// AUTHORS
// ============================================================================

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

export interface AuthorMinified {
  id: string
  name: string
}

export interface AuthorExpanded extends AuthorMinified {
  asin?: string
  description?: string
  /** author image path */
  imagePath?: string
  libraryId: string
  addedAt: number
  updatedAt: number
  numBooks?: number
}

// ============================================================================
// SERIES
// ============================================================================

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

export interface SeriesMinified {
  id: string
  name: string
  /** in series */
  sequence?: string
}

export interface SeriesExpanded {
  id: string
  name: string
  /** name with prefix moved to end (for sorting) */
  nameIgnorePrefix: string
  description?: string
  addedAt: number
  updatedAt: number
  libraryId: string
  /** books in the series */
  books?: LibraryItemMinified[]
  /** if available */
  rssFeed?: RSSFeedMinified
}

// ============================================================================
// METADATA
// ============================================================================

export interface BookMetadata {
  title?: string
  subtitle?: string
  /** minified */
  authors: AuthorMinified[]
  narrators: string[]
  /** minified */
  series: SeriesMinified[]
  /** comma-separated */
  genres: string[]
  publishedYear?: string
  publishedDate?: string
  publisher?: string
  description?: string
  isbn?: string
  asin?: string
  language?: string
  explicit: boolean
  abridged?: boolean
}

export interface PodcastMetadata {
  title?: string
  author?: string
  description?: string
  releaseDate?: string
  /** comma-separated */
  genres: string[]
  feedUrl?: string
  imageUrl?: string
  itunesPageUrl?: string
  itunesId?: string
  itunesArtistId?: string
  explicit: boolean
  language?: string
  podcastType?: string
}

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

// ============================================================================
// MEDIA FILES
// ============================================================================

export interface AudioFile {
  index: number
  ino: string
  metadata: {
    filename: string
    ext: string
    path: string
    relPath: string
    /** in bytes */
    size: number
    mtimeMs: number
    ctimeMs: number
    birthtimeMs: number
  }
  addedAt: number
  updatedAt: number
  trackNumFromMeta?: number
  /** from filename */
  trackNumFromFilename?: number
  discNumFromMeta?: number
  /** from filename */
  discNumFromFilename?: number
  /** in seconds */
  duration: number
  bitRate: number
  language?: string
  codec: string
  timeBase: string
  channels: number
  channelLayout: string
  chapters: Chapter[]
  embeddedCoverArt?: string
  metaTags: Record<string, string>
  mimeType: string
}

export interface AudioTrack extends AudioFile {
  title: string
  contentUrl: string
  startOffset: number
}

export interface Chapter {
  id: number
  /** in seconds */
  start: number
  /** in seconds */
  end: number
  title: string
}

export interface EBookFile {
  ino: string
  metadata: {
    filename: string
    ext: string
    path: string
    relPath: string
    /** in bytes */
    size: number
    mtimeMs: number
    ctimeMs: number
    birthtimeMs: number
  }
  ebookFormat: string
  addedAt: number
  updatedAt: number
}

// ============================================================================
// MEDIA
// ============================================================================

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

export interface BookMediaMinified {
  metadata: BookMetadata
  /** cover image */
  coverPath?: string
  tags: string[]
  numTracks?: number
  numAudioFiles?: number
  numChapters?: number
  /** in seconds */
  duration?: number
  /** in bytes */
  size?: number
  /** if ebook */
  ebookFormat?: string
}

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

export interface PodcastMediaMinified {
  metadata: PodcastMetadata
  /** cover image */
  coverPath?: string
  tags: string[]
  numEpisodes: number
  autoDownloadEpisodes: boolean
  autoDownloadSchedule?: string
  lastEpisodeCheck?: number
  maxEpisodesToKeep: number
  maxNewEpisodesToDownload: number
  /** in bytes */
  size: number
}

// ============================================================================
// PODCAST EPISODES
// ============================================================================

export interface PodcastEpisode {
  libraryItemId: string
  podcastId: string
  id: string
  /** legacy */
  oldEpisodeId?: string
  index?: number
  season?: string
  episode?: string
  episodeType?: string
  title: string
  subtitle?: string
  description?: string
  enclosure?: {
    url: string
    type: string
    /** in bytes (as string) */
    length?: string
  }
  guid?: string
  pubDate?: string
  chapters: Chapter[]
  audioFile?: AudioFile
  publishedAt?: number
  addedAt: number
  updatedAt: number
  audioTrack?: {
    index: number
    startOffset: number
    duration: number
    title: string
    contentUrl: string
    mimeType: string
    codec?: string
    metadata: AudioFile['metadata']
  }
}

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

// ============================================================================
// LIBRARY ITEMS
// ============================================================================

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

export interface LibraryItemMinified {
  id: string
  ino: string
  /** legacy */
  oldLibraryItemId?: string
  libraryId: string
  folderId: string
  path: string
  relPath: string
  isFile: boolean
  mtimeMs: number
  ctimeMs: number
  birthtimeMs: number
  addedAt: number
  updatedAt: number
  isMissing: boolean
  isInvalid: boolean
  mediaType: 'book' | 'podcast'
  media: BookMediaMinified | PodcastMediaMinified
  numFiles: number
  /** in bytes */
  size: number
  /** included when requested */
  rssFeed?: RSSFeedMinified
  /** included when requested */
  mediaItemShare?: MediaItemShare
  /** podcasts only */
  numEpisodesIncomplete?: number
  recentEpisode?: PodcastEpisode
}

export interface LibraryItemQueryParams {
  include?: string // Comma-separated list: progress, rssfeed, share, downloads
  expanded?: number // 1 for expanded view
  episode?: string // Episode ID for progress
}

export interface GetLibraryItemsResponse {
  results: LibraryItem[] | LibraryItemMinified[]
  total?: number
  limit: number
  page: number
  sortBy?: string
  sortDesc: boolean
  filterBy?: string
  mediaType: string
  minified: boolean
  collapseseries: boolean
  include: string
  offset: number
}

export interface UploadCoverResponse {
  success: boolean
  cover: string
}

// ============================================================================
// PROGRESS & BOOKMARKS
// ============================================================================

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

export interface AudioBookmark {
  libraryItemId: string
  title: string
  /** in seconds */
  time: number
  createdAt: number
}

// ============================================================================
// RSS FEEDS & SHARES
// ============================================================================

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

export interface RSSFeedMinified {
  id: string
  slug: string
  /** series/collection/item */
  entityId: string
  entityType: string
  feedUrl: string
}

export interface MediaItemShare {
  id: string
  mediaItemId: string
  mediaItemType: 'book' | 'podcastEpisode'
  userId: string
  slug: string
  playbackSessionId?: string
  /** null for no expiration */
  expiresAt?: number
  createdAt: number
  updatedAt: number
}

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export interface UserPermissions {
  download: boolean
  update: boolean
  delete: boolean
  upload: boolean
  createEreader: boolean
  accessAllLibraries: boolean
  accessAllTags: boolean
  accessExplicitContent: boolean
  /** Whether tags are deny list (true) or allow list (false) */
  selectedTagsNotAccessible: boolean
}

export interface User {
  id: string
  username: string
  email?: string
  type: 'root' | 'admin' | 'user' | 'guest'
  /** Legacy non-expiring token (empty string for root users when hidden) */
  token: string
  isOldToken?: boolean
  mediaProgress: MediaProgress[]
  /** Series IDs to hide from continue listening */
  seriesHideFromContinueListening: string[]
  bookmarks: AudioBookmark[]
  isActive: boolean
  isLocked: boolean
  /** null if never seen */
  lastSeen?: number
  createdAt: number
  permissions: UserPermissions
  /** Library IDs accessible to user (empty if accessAllLibraries is true) */
  librariesAccessible: string[]
  /** Tags selected/filtered for user (empty if accessAllTags is true) */
  itemTagsSelected: string[]
  hasOpenIDLink: boolean
}

export interface EReaderDevice {
  name: string
  email: string
  availabilityOption: 'adminOrUp' | 'userOrUp' | 'guestOrUp' | 'specificUsers'
  /** User IDs with access (only when availabilityOption is 'specificUsers') */
  users?: string[]
}

export interface UserLoginResponse {
  user: User
  userDefaultLibraryId?: string
  serverSettings: ServerSettings
  ereaderDevices: EReaderDevice[]
  /** e.g., 'local', 'docker' */
  Source: string
}

// ============================================================================
// SHELVES
// ============================================================================

export interface PersonalizedShelf {
  id:
    | 'continue-listening'
    | 'continue-reading'
    | 'continue-series'
    | 'newest-episodes'
    | 'recently-added'
    | 'recent-series'
    | 'discover'
    | 'listen-again'
    | 'read-again'
    | 'newest-authors'
  label: string
  labelStringKey: string
  type: 'book' | 'podcast' | 'episode' | 'series' | 'authors'
  /** type depends on shelf type */
  entities: LibraryItemMinified[] | SeriesExpanded[] | AuthorExpanded[]
  total: number
}

// ============================================================================
// SEARCH
// ============================================================================

export interface SearchLibraryResponse {
  book: Array<{ libraryItem: BookLibraryItem }>
  podcast: Array<{ libraryItem: PodcastLibraryItem }>
  narrators: Array<{ name: string; numBooks: number }>
  tags: Array<{ name: string; numItems: number }>
  genres: Array<{ name: string; numItems: number }>
  series: Array<{
    series: Series
    books: LibraryItem[]
  }>
  authors: AuthorExpanded[]
}

// ============================================================================
// METADATA PROVIDERS
// ============================================================================

export interface MetadataProvider {
  /** Provider identifier (e.g. 'google', 'audible', 'itunes') */
  value: string
  /** Display name (e.g. 'Google Books', 'Audible.com') */
  text: string
}

export interface MetadataProvidersResponse {
  providers: {
    books: MetadataProvider[]
    booksCovers: MetadataProvider[]
    podcasts: MetadataProvider[]
  }
}

// ============================================================================
// TYPE UTILITIES
// ============================================================================

export type MediaType<T extends LibraryItem> = T['mediaType']

export type MediaByType<T extends LibraryItem['mediaType']> = T extends 'book' ? BookMedia : T extends 'podcast' ? PodcastMedia : never

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
