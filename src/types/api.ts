// ============================================================================
// ENUMS
// ============================================================================

import { AudibleRegion } from '@/lib/providerUtils'

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  NOTE = 6
}

export enum AuthMethod {
  LOCAL = 'local',
  OPENID = 'openid'
}

export enum BookshelfView {
  STANDARD = 0, // Skeumorphic (original) design
  DETAIL = 1, // Modern default design
  AUTHOR = 2 // Books shown on author page
}

export enum PlayMethod {
  DIRECT_PLAY = 0,
  DIRECT_STREAM = 1,
  TRANSCODE = 2,
  LOCAL = 3
}

export enum PlayerState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR'
}

// ============================================================================
// ENTITY TYPES
// ============================================================================

export type EntityType = 'items' | 'series' | 'collections' | 'playlists' | 'authors'

export type BookshelfEntity = LibraryItem | Series | Collection | Playlist | Author

// ============================================================================
// SERVER & SYSTEM
// ============================================================================

export interface AuthFormData {
  authLoginCustomMessage?: string | null
  authOpenIDButtonText?: string
  authOpenIDAutoLaunch?: boolean
}

// Server status interface
export interface ServerStatus {
  serverVersion: string
  language: string
  isInit: boolean
  authMethods: string[]
  authFormData: AuthFormData
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
  /** IANA timezone of the Audiobookshelf server host (runtime value, not user-configurable) */
  timeZone?: string
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
  /** in bytes */
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

export interface DirectoryEntry {
  path: string
  dirname: string
  level: number
}

export interface GetFilesystemPathsResponse {
  directories: DirectoryEntry[]
  posix: boolean
}

// ============================================================================
// LIBRARIES
// ============================================================================

export interface LibrarySettings {
  coverAspectRatio: 0 | 1
  disableWatcher: boolean
  skipMatchingMediaWithAsin?: boolean
  skipMatchingMediaWithIsbn?: boolean
  autoScanCronExpression?: string | null
  audiobooksOnly?: boolean
  hideSingleBookSeries?: boolean
  onlyShowLaterBooksInContinueSeries?: boolean
  metadataPrecedence?: string[]
  markAsFinishedTimeRemaining?: number | null
  markAsFinishedPercentComplete?: number | null
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
  fullPath: string
  libraryId: string
  updatedAt: number
}

// ============================================================================
// LIBRARY FILTER DATA
// ============================================================================

export interface LibraryFilterData {
  authors: { id: string; name: string }[]
  genres: string[]
  tags: string[]
  series: { id: string; name: string }[]
  narrators: string[]
  publishers: string[]
  languages: string[]
  publishedDecades: string[]
}

// ============================================================================
// AUTHORS
// ============================================================================

export interface Author {
  id: string
  name: string
  description?: string
  imagePath?: string
  asin?: string
  libraryId?: string
  addedAt?: number
  updatedAt?: number
  numBooks?: number
  libraryItems?: LibraryItem[]
  series?: Series[]
}

/** Payload for the `author_removed` socket event (full author JSON or `{ id, libraryId }`). */
export interface AuthorRemovedPayload {
  id: string
  libraryId: string
}

/** Author book-count entry in the `authors_num_books_updated` socket event. */
export interface AuthorNumBooksUpdate {
  id: string
  numBooks: number
}

/** Payload for the `authors_num_books_updated` socket event (scan-linked existing authors). */
export interface AuthorsNumBooksUpdatedPayload {
  libraryId: string
  authors: AuthorNumBooksUpdate[]
}

/** Payload for the `item_removed` socket event. */
export interface LibraryItemRemovedPayload {
  id: string
  libraryId: string
}

/** Payload for the `episode_added` socket event (expanded episode with nested library item). */
export interface EpisodeAddedPayload {
  id: string
  libraryItemId?: string
  libraryItem?: LibraryItem
}

/** Payload for the `stream_progress` socket event (HLS transcode buffer on server). */
export interface StreamProgressPayload {
  stream: string
  percent: string
  chunks: Array<number | string>
  numSegments: number
}

export interface AuthorQuickMatchPayload {
  asin?: string
  q?: string
  region: AudibleRegion
}

export interface AuthorImagePayload {
  url: string
}

export interface UpdateAuthorPayload {
  name?: string
  description?: string
  asin?: string
}

export interface AuthorUpdateResponse {
  updated: boolean
  merged?: boolean
  author: Author
}

export interface AuthorResponse {
  author: Author
}

// ============================================================================
// SERIES
// ============================================================================

export interface SeriesProgress {
  libraryItemIds: string[]
  libraryItemIdsFinished: string[]
  isFinished: boolean
}

export interface Series {
  id: string
  name: string
  /** in series sequence */
  sequence?: string
  /** name with prefix moved to end (for sorting) */
  nameIgnorePrefix?: string
  description?: string
  coverPath?: string
  libraryId?: string
  addedAt?: number
  updatedAt?: number
  bookSeries?: {
    sequence: string
  }
  /** books in the series (expanded only) */
  books?: LibraryItem[]
  /** if available (expanded only) */
  rssFeed?: RssFeed
  /** aggregate read progress for books in the series (`?include=progress`) */
  progress?: SeriesProgress
  /** library items (author page endpoint only) */
  items?: LibraryItem[]
}

/**
 * Single series context the server injects on personalized shelves (e.g. continue-series)
 * and series-filtered bookshelf rows
 */
export interface PersonalizedSeriesRef {
  id: string
  name: string
  sequence?: string | null
}

/** Expanded library items use array of Series and personalized use a single series reference */
export type BookMetadataSeriesField = Series[] | PersonalizedSeriesRef

export function isPersonalizedSeriesRef(series: BookMetadataSeriesField): series is PersonalizedSeriesRef {
  return !Array.isArray(series)
}

export interface CollapsedSeries {
  id: string
  name?: string
  nameIgnorePrefix?: string
  libraryItemIds?: string[]
  numBooks?: number
  seriesSequenceList?: string
}

// ============================================================================
// COLLECTIONS
// ============================================================================

export interface Collection {
  id: string
  name: string
  description?: string
  libraryId: string
  /** books in the collection (expanded only) */
  books?: LibraryItem[]
  /** if available (expanded only) */
  rssFeed?: RssFeed
  createdAt?: number
  updatedAt?: number
}

// ============================================================================
// PLAYLISTS
// ============================================================================

export interface PlaylistItem {
  libraryItemId: string
  libraryItem: LibraryItem
  episodeId?: string
  episode?: PodcastEpisode
}

export interface Playlist {
  id: string
  name: string
  description?: string
  libraryId: string
  userId: string
  /** items in the playlist (expanded only) */
  items?: PlaylistItem[]
  lastUpdate?: number
  createdAt?: number
}

/** Request body entry for playlist create and batch add/remove */
export type PlaylistItemPayload = {
  libraryItemId: string
  episodeId?: string | null
}

// ============================================================================
// METADATA
// ============================================================================

export interface BookMetadata {
  title?: string
  subtitle?: string
  authors: Author[]
  narrators: string[]
  series: BookMetadataSeriesField
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
  // Server-computed properties for display/sorting
  authorName?: string
  authorNameLF?: string
  titleIgnorePrefix?: string
  seriesName?: string
  author?: string
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
  type?: string
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
  metadata: FileMetadata
  addedAt: number
  updatedAt: number
  trackNumFromMeta?: number
  /** from filename */
  trackNumFromFilename?: number
  discNumFromMeta?: number
  /** from filename */
  discNumFromFilename?: number
  exclude?: boolean
  error?: string | null
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

export interface AudibleSearchChapter {
  title: string
  startOffsetSec: number
  startOffsetMs: number
  lengthMs: number
}

export interface AudibleChapterSearchResult {
  runtimeLengthSec: number
  runtimeLengthMs: number
  brandIntroDurationMs?: number
  brandOutroDurationMs?: number
  chapters: AudibleSearchChapter[]
  error?: string
  stringKey?: string
}

export interface UpdateChaptersResponse {
  success: boolean
  updated: boolean
}

export interface OrderedTrackFileData {
  index: number
  filename: string
  ino: string
  exclude: boolean
}

export interface EBookFile {
  ino: string
  metadata: FileMetadata
  ebookFormat: string
  addedAt: number
  updatedAt: number
}

// FFProbe data is a complex nested structure returned by ffprobe/ffmpeg
// Using Record<string, unknown> to allow any JSON-serializable structure
export type FFProbeData = Record<string, unknown>

// ============================================================================
// MEDIA
// ============================================================================

export interface BookMedia {
  id?: string
  libraryItemId?: string
  metadata: BookMetadata
  coverPath?: string
  tags: string[]
  audioFiles?: AudioFile[]
  chapters?: Chapter[]
  ebookFile?: EBookFile
  duration?: number
  size?: number
  tracks?: AudioTrack[]
  numTracks?: number
  numAudioFiles?: number
  numChapters?: number
  ebookFormat?: string
}

export interface PodcastMedia {
  id?: string
  libraryItemId?: string
  metadata: PodcastMetadata
  coverPath?: string
  tags: string[]
  episodes?: PodcastEpisode[]
  autoDownloadEpisodes?: boolean
  autoDownloadSchedule?: string
  lastEpisodeCheck?: number
  maxEpisodesToKeep?: number
  maxNewEpisodesToDownload?: number
  size?: number
  numEpisodes?: number
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

export interface UpdatePodcastEpisodePayload {
  season?: string
  episode?: string
  episodeType?: string
  title?: string
  subtitle?: string
  description?: string
  pubDate?: string
  publishedAt?: number
  chapters?: Chapter[]
  enclosure?: {
    url: string
    type?: string
    length?: string
  } | null
}

export interface SearchPodcastEpisodeResult {
  title?: string
  subtitle?: string
  description?: string
  episode?: string
  episodeType?: string
  season?: string
  pubDate?: string
  publishedAt?: number
  enclosure?: {
    url: string
    type?: string
    length?: string
  }
  guid?: string
}

export interface SearchPodcastEpisodeResponse {
  episodes: Array<{ episode: SearchPodcastEpisodeResult }>
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

/** Episode from GET /api/libraries/:id/recent-episodes (includes nested podcast show) */
export interface RecentPodcastEpisode extends PodcastEpisode {
  libraryId: string
  podcast: PodcastMedia
}

export interface GetEpisodeDownloadQueueResponse {
  currentDownload?: PodcastEpisodeDownload
  queue: PodcastEpisodeDownload[]
}

export interface GetRecentEpisodesResponse {
  episodes: RecentPodcastEpisode[]
  limit: number
  page: number
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
  libraryFiles?: LibraryFile[]
  size?: number
  numFiles?: number

  // Optional additional data based on includeEntities query parameter
  userMediaProgress?: MediaProgress // included when include=progress
  rssFeed?: RssFeed // included when include=rssfeed
  mediaItemShare?: MediaItemShare // included when include=share
  episodeDownloadsQueued?: PodcastEpisodeDownload[] // included when include=downloads
  episodesDownloading?: PodcastEpisodeDownload[] // included when include=downloads
  numEpisodesIncomplete?: number // included in some contexts
  recentEpisode?: PodcastEpisode // included in some contexts (podcasts only)
  collapsedSeries?: CollapsedSeries // included when collapseseries=1
}

export interface BookLibraryItem extends LibraryItem {
  mediaType: 'book'
  media: BookMedia
}

export interface PodcastLibraryItem extends LibraryItem {
  mediaType: 'podcast'
  media: PodcastMedia
}

export interface LibraryItemQueryParams {
  include?: string // Comma-separated list: progress, rssfeed, share, downloads
  expanded?: number // 1 for expanded view
  episode?: string // Episode ID for progress
}

export interface GetLibraryItemsResponse {
  results: LibraryItem[]
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
  displayTitle: string
  displaySubtitle?: string // episode title for podcasts
  duration: number
  progress: number
  currentTime: number
  isFinished: boolean
  hideFromContinueListening?: boolean
  ebookLocation?: string | number
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

export interface RssFeedMeta {
  author: string
  description: string
  explicit: boolean
  feedUrl: string
  imageUrl: string
  language: string
  link: string
  ownerEmail: string | null
  ownerName: string | null
  preventIndexing: boolean
  title: string
  type: 'serial' | 'episodic'
}

export interface RssFeed {
  id: string
  slug: string
  entityId: string
  entityType: string
  entityUpdatedAt: number
  coverPath: string
  feedUrl: string
  serverAddress: string
  userId: string
  episodes?: PodcastEpisode[]
  meta: RssFeedMeta
  createdAt: number
  updatedAt: number
}

export interface GetRssFeedsResponse {
  feeds: RssFeed[]
}

export interface MediaItemShare {
  id: string
  mediaItemId: string
  mediaItemType: 'book' | 'podcastEpisode'
  slug: string
  /** null for no expiration */
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  isDownloadable: boolean
}

/**
 * Response from the public share endpoint GET /public/share/:slug
 * Includes the playback session with audio tracks for the shared item
 */
export interface MediaItemShareResponse extends MediaItemShare {
  playbackSession: PlaybackSession
}

export interface OpenMediaItemSharePayload {
  slug: string
  mediaItemType: 'book' | 'podcastEpisode'
  mediaItemId: string
  /** 0 for no expiration */
  expiresAt: number
  isDownloadable?: boolean
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
  /** Latest playback session (included when include=latestSession) */
  latestSession?: PlaybackSession
}

export interface OnlineUser {
  id: string
  username: string
  type: 'root' | 'admin' | 'user' | 'guest'
  session?: PlaybackSession | null
  lastSeen?: number
  createdAt: number
}

export interface EReaderDevice {
  name: string
  email: string
  availabilityOption: 'adminOrUp' | 'userOrUp' | 'guestOrUp' | 'specificUsers'
  /** User IDs with access (only when availabilityOption is 'specificUsers') */
  users?: string[]
}

export interface EmailSettings {
  id: string
  host: string | null
  port: number
  secure: boolean
  rejectUnauthorized: boolean
  user: string | null
  pass: string | null
  testAddress: string | null
  fromAddress: string | null
  ereaderDevices: EReaderDevice[]
}

export type EmailSettingsFormFields = Pick<EmailSettings, 'host' | 'port' | 'secure' | 'rejectUnauthorized' | 'user' | 'pass' | 'testAddress' | 'fromAddress'>

export interface GetEmailSettingsResponse {
  settings: EmailSettings
}

export interface UpdateEmailSettingsResponse {
  settings: EmailSettings
}

export interface UpdateEReaderDevicesResponse {
  ereaderDevices: EReaderDevice[]
}

export interface NotificationEvent {
  name: string
  requiresLibrary: boolean
  libraryMediaType?: string
  description: string
  descriptionKey: string
  variables: string[]
  defaults: {
    title: string
    body: string
  }
  testData: Record<string, string>
}

export interface Notification {
  id: string
  libraryId: string | null
  eventName: string
  urls: string[]
  titleTemplate: string
  bodyTemplate: string
  type: string | null
  enabled: boolean
  lastFiredAt: number | null
  lastAttemptFailed: boolean
  numConsecutiveFailedAttempts: number
  numTimesFired: number
  createdAt: number
}

export interface NotificationSettings {
  id: string
  appriseType: string
  appriseApiUrl: string | null
  notifications: Notification[]
  maxFailedAttempts: number
  maxNotificationQueue: number
  notificationDelay: number
}

export interface NotificationData {
  events: NotificationEvent[]
}

export interface GetNotificationsResponse {
  data: NotificationData
  settings: NotificationSettings
}

export type NotificationSettingsPatch = Pick<NotificationSettings, 'appriseApiUrl' | 'maxNotificationQueue' | 'maxFailedAttempts'>

export interface NotificationFormPayload {
  id?: string
  libraryId?: string | null
  eventName: string
  urls: string[]
  titleTemplate: string
  bodyTemplate: string
  enabled: boolean
  type?: string | null
}

export type NotificationUpdatePayload = Partial<NotificationFormPayload>

export interface OpenIdIssuerConfig {
  issuer?: string
  authorization_endpoint?: string
  token_endpoint?: string
  userinfo_endpoint?: string
  end_session_endpoint?: string
  jwks_uri?: string
  id_token_signing_alg_values_supported?: string[]
}

export interface AuthenticationSettings {
  authLoginCustomMessage?: string | null
  authActiveAuthMethods: AuthMethod[]
  authOpenIDIssuerURL?: string | null
  authOpenIDAuthorizationURL?: string | null
  authOpenIDTokenURL?: string | null
  authOpenIDUserInfoURL?: string | null
  authOpenIDJwksURL?: string | null
  authOpenIDLogoutURL?: string | null
  authOpenIDClientID?: string | null
  authOpenIDClientSecret?: string | null
  authOpenIDTokenSigningAlgorithm: string
  authOpenIDButtonText: string
  authOpenIDAutoLaunch: boolean
  authOpenIDAutoRegister: boolean
  authOpenIDMatchExistingBy?: string | null
  authOpenIDMobileRedirectURIs?: string[]
  authOpenIDGroupClaim?: string | null
  authOpenIDAdvancedPermsClaim?: string | null
  authOpenIDSubfolderForRedirectURLs?: string
  authOpenIDSamplePermissions?: string
}

export type AuthenticationSettingsPatch = Omit<AuthenticationSettings, 'authOpenIDSamplePermissions'>

export interface UpdateAuthSettingsResponse {
  updated: boolean
  serverSettings: ServerSettings
}

export interface UserLoginResponse {
  user: User
  userDefaultLibraryId?: string
  serverSettings: ServerSettings
  ereaderDevices: EReaderDevice[]
  /** e.g., 'local', 'docker' */
  Source: string
}

export interface ApiKey {
  createdAt: string
  createdByUser: {
    id: string
    username: string
    type: string
  }
  createdByUserId: string
  description: string | null
  expiresAt: string | null // e.g. 2026-01-23T00:56:47.402Z
  id: string
  isActive: boolean
  lastUsedAt: string | null
  name: string
  updatedAt: string
  user: {
    id: string
    username: string
    type: string
  }
  userId: string
  apiKey?: string // Only returned when creating a new API key
}

export interface GetApiKeysResponse {
  apiKeys: ApiKey[]
}

export interface CreateApiKeyPayload {
  name: string
  expiresIn?: number
  isActive: boolean
  userId: string
}

export interface CreateUpdateApiKeyResponse {
  apiKey: ApiKey
}

export interface CustomMetadataProvider {
  id: string
  name: string
  mediaType: 'book' | 'podcast'
  url: string
  authHeaderValue: string | null
  createdAt: string
  updatedAt: string
}

export interface GetCustomMetadataProvidersResponse {
  providers: CustomMetadataProvider[]
}

export interface CreateCustomMetadataProviderPayload {
  name: string
  url: string
  mediaType: 'book' | 'podcast'
  authHeaderValue?: string
}

export interface CreateCustomMetadataProviderResponse {
  provider: CustomMetadataProvider
}

// ============================================================================
// BACKUPS
// ============================================================================

export interface Backup {
  id: string
  key: string | null
  backupDirPath: string
  datePretty: string
  fullPath: string
  path: string
  filename: string
  fileSize: number
  createdAt: number
  serverVersion: string | null
}

export interface GetBackupsResponse {
  backupLocation: string
  backupPathEnvSet: boolean
  backups: Backup[]
}

export interface MutateBackupsResponse {
  backups: Backup[]
}

// ============================================================================
// SHELVES
// ============================================================================

export type PersonalizedShelfType = 'book' | 'podcast' | 'episode' | 'series' | 'authors'

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
  type: PersonalizedShelfType
  /** type depends on shelf type */
  entities: LibraryItem[] | Series[] | Author[]
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
  authors: Author[]
  episodes?: Array<{ libraryItem: PodcastLibraryItem }>
  /** Client-side filtered collections (not from server search API) */
  collections?: Collection[]
  /** Client-side filtered playlists (not from server search API) */
  playlists?: Playlist[]
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
  return 'audioFiles' in media || 'numTracks' in media
}

export function isPodcastMedia(media: BookMedia | PodcastMedia): media is PodcastMedia {
  return 'episodes' in media || 'numEpisodes' in media
}

export function isBookMetadata(metadata: BookMetadata | PodcastMetadata): metadata is BookMetadata {
  return 'authors' in metadata || 'authorName' in metadata
}

export function isPodcastMetadata(metadata: BookMetadata | PodcastMetadata): metadata is PodcastMetadata {
  return 'author' in metadata && !('authors' in metadata)
}

export function isBookLibraryItem(item: LibraryItem): item is BookLibraryItem {
  return item.mediaType === 'book'
}

export function isPodcastLibraryItem(item: LibraryItem): item is PodcastLibraryItem {
  return item.mediaType === 'podcast'
}

export function isBookMediaWithTracks(media: BookMedia | PodcastMedia): boolean {
  return isBookMedia(media) && (media.tracks ? media.tracks.length : media.numTracks || 0) > 0
}

// ============================================================================
// SEARCH & MATCH TYPES
// ============================================================================

export interface BookSearchResult {
  title?: string
  subtitle?: string
  author?: string
  narrator?: string | string[]
  cover?: string
  covers?: string[]
  description?: string
  descriptionPlain?: string
  publisher?: string
  publishedYear?: string
  series?: Array<{ series: string; sequence?: string }>
  genres?: string | string[]
  tags?: string | string[]
  language?: string
  explicit?: boolean
  abridged?: boolean
  isbn?: string
  asin?: string
  duration?: number
  matchConfidence?: number
}

export interface PodcastSearchResult {
  title?: string
  author?: string
  artistName?: string
  cover?: string
  covers?: string[]
  description?: string
  descriptionPlain?: string
  genres?: string | string[]
  tags?: string | string[]
  language?: string
  explicit?: boolean
  feedUrl?: string
  itunesPageUrl?: string
  itunesId?: string | number
  releaseDate?: string
  duration?: number
  trackCount?: number
  matchConfidence?: number
  // Raw API response fields
  pageUrl?: string
  id?: string | number
}

export type MatchResult = BookSearchResult | PodcastSearchResult

export interface UpdateLibraryItemMediaPayload {
  metadata?: {
    title?: string
    subtitle?: string
    authors?: Author[]
    narrators?: string[]
    series?: Series[]
    genres?: string[]
    tags?: string[]
    publisher?: string
    publishedYear?: string
    publishedDate?: string
    description?: string
    language?: string
    explicit?: boolean
    abridged?: boolean
    isbn?: string
    asin?: string
    // Podcast-specific fields
    feedUrl?: string
    itunesPageUrl?: string
    itunesId?: string | number
    releaseDate?: string
    [key: string]: unknown
  }
  tags?: string[]
  url?: string
  autoDownloadEpisodes?: boolean
  autoDownloadSchedule?: string
  maxEpisodesToKeep?: number
  maxNewEpisodesToDownload?: number
}

export interface UpdateLibraryItemMediaResponse {
  updated: boolean
  libraryItem?: LibraryItem
}

export interface BatchGetLibraryItemsResponse {
  libraryItems: LibraryItem[]
}

export interface BatchUpdateLibraryItemPayload {
  id: string
  mediaPayload: UpdateLibraryItemMediaPayload
}

export interface BatchUpdateLibraryItemsResponse {
  success: boolean
  updates: number
}

// ============================================================================
// TASKS & PROGRESS TRACKING
// ============================================================================

/** FFmpeg metadata tags that would be embedded into audio files (empty values omitted). */
export type MetadataObject = Record<string, string>

export interface M4bEncodeOptions {
  bitrate: string
  channels: string | number
  codec: string
}

export interface Task {
  id: string
  action: string // 'embed-metadata' | 'encode-m4b'
  data?: {
    libraryId?: string
    libraryItemId?: string
    encodeOptions?: M4bEncodeOptions
    [key: string]: unknown
  }
  title: string | null
  titleKey: string | null
  titleSubs: string[] | null
  description: string | null
  descriptionKey: string | null
  descriptionSubs: string[] | null
  error: string | null
  errorKey: string | null
  errorSubs: string[] | null
  showSuccess: boolean
  isFailed: boolean
  isFinished: boolean
  startedAt: number | null
  finishedAt: number | null
}

export interface MetadataEmbedQueueUpdate {
  libraryItemId: string
  queued: boolean
}

export interface TrackStartedPayload {
  libraryItemId: string
  ino: string
}

export interface TrackFinishedPayload {
  libraryItemId: string
  ino: string
}

export interface TrackProgressPayload {
  libraryItemId: string
  ino: string
  progress: number
}

export interface TaskProgressPayload {
  libraryItemId: string
  progress: number
}

export interface TasksResponse {
  tasks: Task[]
  queuedTaskData?: {
    embedMetadata?: Array<{ libraryItemId: string }>
  }
}

export interface LibraryTaskPayload {
  libraryId: string
}

export interface GetNarratorsResponse {
  narrators: NarratorObject[]
}

export interface NarratorObject {
  /** this is the name base64 encoded for use in filters */
  id: string
  name: string
  numBooks: number
}

export interface GetAuthorsResponse {
  // When paginated (limit/page query params), uses 'results' instead of 'authors'
  authors?: Author[]
  results?: Author[]
  total?: number
  limit?: number
  page?: number
  sortBy?: string
  sortDesc?: boolean
  filterBy?: string
  minified?: boolean
  include?: string
}

export interface GetSeriesResponse {
  results: Series[]
  total: number
  limit: number
  page: number
  sortDesc: boolean
  minified: boolean
  include: string
}

export interface GetCollectionsResponse {
  results: Collection[]
  total: number
  limit: number
  page: number
  sortDesc: boolean
  minified: boolean
  include: string
}

export interface GetPlaylistsResponse {
  results: Playlist[]
  total: number
  limit: number
  page: number
}

export type SaveLibraryOrderApiResponse = {
  libraries: Library[]
}

/**
 * Audio track metadata from server
 */
export interface AudioTrackData {
  index: number
  startOffset: number
  duration: number
  title: string
  contentUrl: string
  mimeType: string
  metadata?: Record<string, unknown>
}

/**
 * Device info sent to server when starting a session
 */
export interface DeviceInfo {
  id: string
  userId: string
  deviceId: string
  ipAddress: string
  // From user agent
  browserName?: string
  browserVersion?: string
  osName?: string
  osVersion?: string
  deviceType?: string
  // From client
  clientVersion?: string
  manufacturer?: string
  model?: string
  sdkVersion?: string // Android only
  clientName?: string
  deviceName?: string
}

/**
 * Playback session response from server
 */
export interface PlaybackSession {
  id: string
  userId: string
  user?: {
    id: string
    username: string
  } | null
  libraryId: string
  libraryItemId: string
  bookId?: string
  episodeId?: string
  mediaType: 'book' | 'podcast'
  mediaMetadata: Record<string, unknown>
  chapters: Chapter[]
  displayTitle: string
  displayAuthor: string
  coverPath?: string
  duration: number
  playMethod: PlayMethod
  mediaPlayer: string
  deviceInfo: DeviceInfo | null
  serverVersion: string
  date: string
  dayOfWeek: string
  timeListening: number
  startTime: number
  currentTime: number
  startedAt: number
  updatedAt: number
  audioTracks: AudioTrackData[]
  libraryItem: LibraryItem | null
  open?: boolean
  /** Only for share sessions - it's the only way the share player can know the library cover aspect ratio */
  coverAspectRatio?: 0 | 1
}

/**
 * Aggregated listening stats from GET /api/me/listening-stats
 */
export interface ListeningStatsItemAggregate {
  id: string
  timeListening: number
  mediaMetadata: Record<string, unknown>
  lastUpdate?: number
}

export interface ListeningStats {
  totalTime: number
  items: Record<string, ListeningStatsItemAggregate>
  days: Record<string, number>
  dayOfWeek: Record<string, number>
  today: number
  recentSessions: PlaybackSession[]
}

export interface GetListeningSessionsResponse {
  total: number
  numPages: number
  page: number
  itemsPerPage: number
  sessions: PlaybackSession[]
  userId?: string
}

export interface GetOpenListeningSessionsResponse {
  sessions: PlaybackSession[]
  shareSessions: PlaybackSession[]
  /** Cover aspect ratio from library settings (included in share sessions) */
  coverAspectRatio?: 0 | 1
}

/**
 * Payload for starting a playback session
 */
export interface StartSessionDeviceInfo {
  clientName: string
  deviceId: string
}
export interface StartSessionPayload {
  deviceInfo: StartSessionDeviceInfo
  supportedMimeTypes: string[]
  mediaPlayer: 'html5' | 'chromecast'
  forceTranscode: boolean
  forceDirectPlay: boolean
}

// ============================================================================
// LOGGER DATA
// ============================================================================

export interface LoggerDataLog {
  level: number
  levelName: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'TRACE'
  message: string
  source: string // e.g. Server.js:143
  timestamp: string // e.g. 2026-01-20 15:37:42.926
}

export interface GetLoggerDataResponse {
  currentDailyLogs: LoggerDataLog[]
}

// ============================================================================
// PODCAST RSS FEEDS
// ============================================================================

export interface RssPodcastChapter {
  id: number
  title: string
  start: number
  end: number
}

export interface RssPodcastEpisode {
  title: string
  subtitle: string
  description: string
  descriptionPlain: string
  pubDate: string
  episodeType: string
  season: string
  episode: string
  author: string
  duration: string
  durationSeconds: number | null
  explicit: string
  publishedAt: number | null
  enclosure: { url: string; type?: string; length?: string }
  guid: string
  chaptersUrl: string
  chaptersType: string
  chapters: RssPodcastChapter[]
}

export interface RssPodcastMetadata {
  title: string
  language: string
  explicit: string
  author: string
  pubDate: string
  link: string
  image: string
  categories: string[]
  feedUrl: string
  description: string
  descriptionPlain: string
  type: string
}

export interface RssPodcast {
  metadata: RssPodcastMetadata
  episodes: RssPodcastEpisode[]
  numEpisodes?: number
}

export interface FetchPodcastFeedResponse {
  podcast: RssPodcast
}

export interface PodcastTitleInLibrary {
  title: string
  itunesId: string | number | null
  libraryItemId: string
  libraryId: string
}

export interface GetPodcastTitlesResponse {
  podcasts: PodcastTitleInLibrary[]
}

export interface OpmlFeed {
  title: string
  feedUrl: string
}

export interface ParseOpmlFeedsResponse {
  feeds: OpmlFeed[]
}

export interface CreatePodcastsFromOpmlPayload {
  feeds: string[]
  folderId: string
  libraryId: string
  autoDownloadEpisodes: boolean
}

export interface CreatePodcastMetadataPayload {
  title: string
  author: string
  description: string
  releaseDate: string
  genres: string[]
  feedUrl: string
  imageUrl: string
  itunesPageUrl: string
  itunesId: string
  itunesArtistId: string
  language: string
  explicit: boolean
  type: string
}

export interface CreatePodcastPayload {
  path: string
  folderId: string
  libraryId: string
  media: {
    metadata: CreatePodcastMetadataPayload
    autoDownloadEpisodes: boolean
  }
}

// ============================================================================
// OPEN RSS FEED
// ============================================================================

export interface OpenRssFeedPayload {
  serverAddress: string
  slug: string
  metadataDetails: {
    preventIndexing: boolean
    ownerName: string
    ownerEmail: string
  }
}

export interface OpenRssFeedResponse {
  feed: RssFeed
}

// ============================================================================
// Library Stats
// ============================================================================

interface LargestItem {
  id: string
  title: string
  size: number // size in bytes
}

interface AuthorWithCount {
  id: string
  name: string
  count: number
}

interface GenreWithCount {
  genre: string
  count: number
}

interface LongestItem {
  id: string
  title: string
  duration: number
}

export interface LibraryStatsResponse {
  largestItems: LargestItem[]
  totalAuthors?: number // only for books
  authorsWithCount?: AuthorWithCount[] // only for books
  totalGenres: number
  genresWithCount: GenreWithCount[]
  totalItems: number
  longestItems: LongestItem[]
  totalSize: number
  totalDuration: number
  numAudioTracks: number
}
