'use client'

import SquareGridGroupCover from '@/components/widgets/media-card/SquareGridGroupCover'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { PlaylistItem } from '@/types/api'

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
  const t = useTypeSafeTranslations()

  return <SquareGridGroupCover items={items} width={width} height={height} emptyLabel={t('LabelEmptyPlaylist')} />
}
