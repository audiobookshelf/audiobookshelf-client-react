'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { GetAuthorsResponse } from '@/types/api'
import Image from 'next/image'
import Link from 'next/link'

interface AuthorsClientProps {
  authorsData: GetAuthorsResponse
}

export default function AuthorsClient({ authorsData }: AuthorsClientProps) {
  const t = useTypeSafeTranslations()
  const authors = authorsData.authors

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {authors.map((author) => {
          const imageUrl = author.imagePath ? `/api/authors/${author.id}/image` : null
          return (
            <Link
              key={author.id}
              href={`/author/${author.id}`}
              className="p-4 rounded-lg border border-border bg-primary/30 hover:bg-primary/70 cursor-pointer w-40 h-48 relative flex items-center justify-center text-center overflow-hidden"
            >
              {imageUrl && <Image src={imageUrl} unoptimized alt={author.name} fill objectFit="cover" />}
              <div className="absolute left-0 right-0 bottom-0 p-2 bg-black/50 text-white">
                <h3 className="text-xs font-semibold mb-1 truncate">{author.name}</h3>
                <p className="text-xs text-gray-300">{t('LabelXBooks', { count: author.numBooks ?? 0 })}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
