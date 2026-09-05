'use client'

import { listFormatParts } from '@/lib/formatList'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useMemo } from 'react'

interface AuthorLinksProps {
  libraryId: string
  authors: { id: string; name: string }[]
  onNavigate?: () => void
}

export default function AuthorLinks({ libraryId, authors, onNavigate }: AuthorLinksProps) {
  const locale = useLocale()
  const segments = useMemo(() => {
    const parts = listFormatParts(
      authors.map((author) => author.name),
      locale
    )
    const next: Array<{ type: 'separator'; value: string } | { type: 'author'; author: { id: string; name: string } }> = []
    let elementIndex = 0

    for (const part of parts) {
      if (part.type === 'literal') {
        next.push({ type: 'separator', value: part.value })
        continue
      }

      const author = authors[elementIndex]
      elementIndex += 1
      if (author) {
        next.push({ type: 'author', author })
      }
    }

    return next
  }, [authors, locale])

  return segments.map((segment, index) => {
    if (segment.type === 'separator') {
      return (
        <span key={`sep-${index}`} className="whitespace-pre">
          {segment.value}
        </span>
      )
    }

    return (
      <Link key={segment.author.id} href={`/library/${libraryId}/authors/${segment.author.id}`} className="link-underline" onClick={onNavigate}>
        {segment.author.name}
      </Link>
    )
  })
}
