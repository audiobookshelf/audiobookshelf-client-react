// Sync timing
export const FIRST_SYNC_DELAY = 20 // seconds - first sync after this much listening time
export const SUBSEQUENT_SYNC_INTERVAL = 10 // seconds - subsequent syncs every this many seconds

// Playable MIME types that we check browser support for
export const AUDIO_MIME_TYPES = ['audio/flac', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/aac', 'audio/x-ms-wma', 'audio/x-aiff', 'audio/webm'] as const
