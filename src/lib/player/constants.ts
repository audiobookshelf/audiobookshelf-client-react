// Sync timing
export const FIRST_SYNC_DELAY = 20 // seconds - first sync after this much listening time
export const SUBSEQUENT_SYNC_INTERVAL = 10 // seconds - subsequent syncs every this many seconds

// Volume step for keyboard hotkeys (0-1 range, so 0.05 = 5%)
export const VOLUME_HOTKEY_STEP = 0.05

// Playable MIME types that we check browser support for
export const AUDIO_MIME_TYPES = ['audio/flac', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/aac', 'audio/x-ms-wma', 'audio/x-aiff', 'audio/webm'] as const
