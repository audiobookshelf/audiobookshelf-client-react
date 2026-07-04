'use client'

import SquareGridGroupCover from '@/components/widgets/media-card/SquareGridGroupCover'
import type { PlaylistItem } from '@/types/api'
import { useMemo } from 'react'

interface PlaylistGroupCoverProps {
  /** Items in the playlist */
  items: PlaylistItem[]
  /** Width of the cover area in pixels */
  width: number
  /** Height of the cover area in pixels */
  height: number
}

/**
 * Cover component for playlists that displays up to 4 covers in a 2x2 grid.
 */
export default function PlaylistGroupCover({ items, width, height }: PlaylistGroupCoverProps) {
  const libraryItems = useMemo(() => items.map((item) => item.libraryItem), [items])

  return <SquareGridGroupCover libraryItems={libraryItems} width={width} height={height} emptyLabel="Empty Playlist" />
}
