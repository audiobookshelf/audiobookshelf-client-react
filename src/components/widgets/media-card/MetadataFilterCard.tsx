'use client'

import TruncatingTooltipText from '@/components/ui/TruncatingTooltipText'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { filterEncode } from '@/lib/filterUtils'
import Link from 'next/link'
import { memo, useMemo } from 'react'

export type MetadataFilterKey = 'genres' | 'tags' | 'narrators'

export interface MetadataFilterCardProps {
  name: string
  count: number
  filterKey: MetadataFilterKey
  icon: string
}

function MetadataFilterCard({ name, count, filterKey, icon }: MetadataFilterCardProps) {
  const t = useTypeSafeTranslations()
  const { library } = useLibrary()
  const { sizeMultiplier } = useCardSize()

  const coverHeight = useMemo(() => 100 * sizeMultiplier, [sizeMultiplier])
  const coverWidth = useMemo(() => coverHeight * 1.5, [coverHeight])

  const href = `/library/${library.id}/items?filter=${filterKey}.${filterEncode(name)}`

  const countLabel = useMemo(() => {
    if (filterKey === 'narrators') {
      return t('LabelXBooks', { count })
    }
    if (library.mediaType === 'podcast') {
      return `${count} Podcast${count === 1 ? '' : 's'}`
    }
    return t('LabelXBooks', { count })
  }, [count, filterKey, library.mediaType, t])

  return (
    <Link href={href} className="block no-underline">
      <div
        className="bg-primary box-shadow-book relative overflow-hidden rounded-md"
        style={{ width: `${coverWidth}px`, height: `${coverHeight}px`, fontSize: `${sizeMultiplier}rem` }}
      >
        <div className="pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center">
          <span className="material-symbols text-[8em] text-white opacity-40">{icon}</span>
        </div>

        <div className="absolute start-0 bottom-0 z-10 w-full bg-black/75 px-2 py-1">
          <div className="text-[0.75em]">
            <TruncatingTooltipText text={name} position="bottom" className="text-center font-semibold text-white" />
          </div>
          <p className="text-center text-[0.65em] text-gray-200">{countLabel}</p>
        </div>
      </div>
    </Link>
  )
}

export default memo(MetadataFilterCard)
