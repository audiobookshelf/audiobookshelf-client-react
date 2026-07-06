'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import IconBtn from '@/components/ui/IconBtn'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import type { BookLibraryItem } from '@/types/api'
import Link from 'next/link'
import type { ReactNode } from 'react'

const COVER_HEIGHT = 36

/** Width of the centered header row (two max-w-2xl columns). Use for subpage content alignment. */
export const libraryItemSubpageMaxWidthClass = 'max-w-[84rem]'

interface LibraryItemSubpageHeaderProps {
  libraryItem: BookLibraryItem
  libraryId: string
  itemId: string
  title: string
  onEditClick: () => void
  trailing?: ReactNode
}

export default function LibraryItemSubpageHeader({ libraryItem, libraryId, itemId, title, onEditClick, trailing }: LibraryItemSubpageHeaderProps) {
  const t = useTypeSafeTranslations()
  const bookCoverAspectRatio = useBookCoverAspectRatio()
  const coverSrc = getLibraryItemCoverSrc(libraryItem, getPlaceholderCoverUrl())

  return (
    <div className="mb-4 flex flex-wrap items-center justify-center sm:mb-6 sm:flex-nowrap">
      <div className="w-full max-w-2xl">
        <div className="flex items-center">
          <div className="me-3 shrink-0">
            <PreviewCover src={coverSrc} width={COVER_HEIGHT / bookCoverAspectRatio} showResolution={false} />
          </div>
          <Link href={`/library/${libraryId}/item/${itemId}`} className="hover:underline">
            <h1 className="text-lg lg:text-xl">{title}</h1>
          </Link>
          <IconBtn ariaLabel={t('ButtonEdit')} borderless size="small" className="ml-2" onClick={onEditClick}>
            edit
          </IconBtn>
        </div>
      </div>
      {trailing !== undefined ? (
        <div className="w-full max-w-2xl">{trailing}</div>
      ) : (
        <div className="hidden w-full max-w-2xl sm:block" aria-hidden />
      )}
    </div>
  )
}
