'use client'

import { useCompilationDisplayMode, type CompilationDisplayMode } from '@/hooks/useCompilationDisplayMode'
export type PlaylistDisplayMode = CompilationDisplayMode

function getDefaultMode(mediaType: 'book' | 'podcast'): PlaylistDisplayMode {
  return mediaType === 'podcast' ? 'list' : 'bookshelf'
}

export function usePlaylistDisplayMode(mediaType: 'book' | 'podcast') {
  const storageKey = `playlistDisplayMode:${mediaType}`
  return useCompilationDisplayMode(storageKey, getDefaultMode(mediaType))
}
