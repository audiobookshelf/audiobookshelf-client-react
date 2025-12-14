import AuthorImage from '@/components/covers/AuthorImage'
import { FlatResultItem } from '@/hooks/useGlobalSearchTransformer'
import { mergeClasses } from '@/lib/merge-classes'
import Link from 'next/link'
import React, { useEffect, useMemo } from 'react'

const HighlightMatch = ({ text, query }: { text: string; query: string }) => {
  const parts = useMemo(() => {
    if (!query) return [{ text, isMatch: false }]
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedQuery})`, 'gi')
    return text.split(regex).map((part) => ({
      text: part,
      isMatch: part.toLowerCase() === query.toLowerCase()
    }))
  }, [text, query])

  return (
    <>
      {parts.map((part, i) =>
        part.isMatch ? (
          <span key={i} className="font-bold text-amber-600 dark:text-amber-500">
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  )
}

interface GlobalSearchMenuProps {
  results: FlatResultItem[]
  focusedIndex: number
  onItemClick: () => void
  menuRef: React.RefObject<HTMLDivElement | null>
  searchQuery: string
}

export default function GlobalSearchMenu({ results, focusedIndex, onItemClick, menuRef, searchQuery }: GlobalSearchMenuProps) {
  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && menuRef.current) {
      const el = menuRef.current.querySelector(`[data-index="${focusedIndex}"]`)
      if (el) {
        el.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedIndex, menuRef])

  return (
    <div
      ref={menuRef}
      id="global-search-menu"
      role="listbox"
      tabIndex={-1}
      className="absolute z-50 mt-1 w-full max-h-[calc(100vh-100px)] overflow-y-auto bg-primary border border-dropdown-menu-border shadow-lg rounded-md py-1 ring-1 ring-black/5 globalSearchMenu"
      onMouseDown={(e) => e.preventDefault()} // Prevent blur on scroll click
    >
      {results.map((result, index) => {
        if (result.isPlaceholder) {
          return (
            <div key={result.id} className="py-2 px-3 text-sm text-gray-500">
              {result.placeholderText}
            </div>
          )
        }

        if (result.type === 'header') {
          return (
            <div key={result.id} className="px-3 py-1 mt-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {result.title}
            </div>
          )
        }

        const isSelected = focusedIndex === index
        const isAuthor = result.type === 'author'
        const usePortrait = isAuthor // Authors keep the portrait ratio
        // Books, Series, Podcasts, etc use square
        const containerClass = usePortrait
          ? 'w-8 h-12' // Portrait
          : 'w-12 h-12' // Square

        const hasImage = !!result.imageSrc || isAuthor

        return (
          <Link
            key={`${result.type}-${result.id}`}
            href={result.link || '#'}
            id={`result-item-${index}`}
            data-index={index}
            tabIndex={-1}
            className={mergeClasses(
              'block px-3 py-2 cursor-pointer no-underline select-none',
              'hover:bg-dropdown-item-hover',
              isSelected ? 'bg-dropdown-item-selected' : ''
            )}
            onClick={onItemClick}
            role="option"
            aria-selected={isSelected}
          >
            <div className="flex items-center gap-3">
              {/* Image / Icon */}
              {hasImage ? (
                <div className={mergeClasses('flex-shrink-0 relative bg-bg-secondary rounded-sm overflow-hidden flex items-center justify-center shadow-sm', containerClass)}>
                  {result.type === 'author' && result.originalItem ? (
                    <AuthorImage author={result.originalItem} className="w-full h-full" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.imageSrc} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
              ) : (
                // Placeholder or Icon for items without images (Tags/Genres)
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center">
                  <span className="material-symbols text-gray-400 text-lg">
                    {result.type === 'tag' ? 'label' : result.type === 'genre' ? 'category' : result.type === 'collection' ? 'collections_bookmark' : result.type === 'playlist' ? 'library_music' : 'record_voice_over'}
                  </span>
                </div>
              )}

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  <HighlightMatch text={result.title} query={searchQuery} />
                </div>
                {/* Only show subtitle if it exists */}
                {result.subtitle && (
                  <div className="text-xxs text-foreground-subdued truncate">
                    <HighlightMatch text={result.subtitle} query={searchQuery} />
                  </div>
                )}
                {/* Show author if it exists */}
                {result.author && (
                  <div className="text-xs text-foreground truncate">
                    <HighlightMatch text={result.author} query={searchQuery} />
                  </div>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
