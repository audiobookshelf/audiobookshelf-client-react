import AuthorImage from '@/components/covers/AuthorImage'
import { FlatResultItem, SearchResultType } from '@/hooks/useGlobalSearchTransformer'
import { useMenuPosition } from '@/hooks/useMenuPosition'
import { useScrollToFocused } from '@/hooks/useScrollToFocused'
import { mergeClasses } from '@/lib/merge-classes'
import Link from 'next/link'
import React, { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

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

const getMaterialSymbolIcon = (type: SearchResultType): string => {
  switch (type) {
    case 'tag':
      return 'label'
    case 'genre':
      return 'category'
    case 'collection':
      return 'collections_bookmark'
    case 'playlist':
      return 'library_music'
    default:
      return 'record_voice_over'
  }
}

interface GlobalSearchMenuProps {
  results: FlatResultItem[]
  focusedIndex: number
  onItemClick: () => void
  menuRef: React.RefObject<HTMLDivElement | null>
  searchQuery: string
  /** Optional callback for when an item is selected. If provided, items become buttons instead of links. */
  onItemSelect?: (item: FlatResultItem) => void
  /** Use portal to render the menu. Useful for avoiding clipping issues. */
  usePortal?: boolean
  /** Ref to the input/trigger element, required for portal positioning */
  triggerRef?: React.RefObject<HTMLElement | null>
}

export default function GlobalSearchMenu({
  results,
  focusedIndex,
  onItemClick,
  menuRef,
  searchQuery,
  onItemSelect,
  usePortal = false,
  triggerRef
}: GlobalSearchMenuProps) {
  // Scroll focused item into view
  // Scroll focused item into view
  const [menuPosition, setMenuPosition] = useState({ top: '0px', left: '0px', width: 'auto' })

  useMenuPosition({
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    menuRef: menuRef as React.RefObject<HTMLElement>,
    isOpen: true,
    onPositionChange: setMenuPosition,
    disable: !usePortal
  })

  // Scroll focused item into view
  useScrollToFocused({
    containerRef: menuRef,
    focusedIndex,
    getElement: useCallback((container, index) => container.querySelector(`[data-index="${index}"]`) as HTMLElement, [])
  })

  const menuContent = (
    <div
      ref={menuRef}
      cy-id="global-search-menu"
      role="listbox"
      tabIndex={-1}
      className="absolute z-50 mt-1 w-full max-h-[calc(100vh-100px)] overflow-y-auto bg-primary border border-dropdown-menu-border shadow-lg rounded-md py-1 ring-1 ring-black/5 globalSearchMenu"
      style={
        usePortal
          ? {
              position: 'absolute',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 9999
            }
          : {}
      }
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
        const shouldHighlightSubtitle = result.type === 'book' || result.type === 'podcast' || result.type === 'episode'
        const usePortrait = isAuthor // Authors keep the portrait ratio
        // Books, Series, Podcasts, etc use square
        const containerClass = usePortrait
          ? 'w-8 h-12' // Portrait
          : 'w-12 h-12' // Square

        const hasImage = !!result.imageSrc || isAuthor

        const itemContent = (
          <div className="flex items-center gap-3">
            {/* Image / Icon */}
            {hasImage ? (
              <div
                className={mergeClasses(
                  'flex-shrink-0 relative bg-bg-secondary rounded-sm overflow-hidden flex items-center justify-center shadow-sm',
                  containerClass
                )}
              >
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
                <span className="material-symbols text-gray-400 text-lg">{getMaterialSymbolIcon(result.type)}</span>
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
                  {shouldHighlightSubtitle ? <HighlightMatch text={result.subtitle} query={searchQuery} /> : <span>{result.subtitle}</span>}
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
        )

        const itemKey = `${result.type}-${result.id}`
        const commonProps = {
          id: `result-item-${index}`,
          'data-index': index,
          tabIndex: -1,
          className: mergeClasses(
            'block px-3 py-2 cursor-pointer no-underline select-none',
            'hover:bg-dropdown-item-hover',
            isSelected ? 'bg-dropdown-item-selected' : ''
          ),
          role: 'option' as const,
          'aria-selected': isSelected
        }

        // If onItemSelect is provided, render as button for selection
        if (onItemSelect) {
          return (
            <div
              key={itemKey}
              {...commonProps}
              onClick={() => {
                onItemSelect(result)
                onItemClick()
              }}
            >
              {itemContent}
            </div>
          )
        }

        // Otherwise render as Link for navigation
        return (
          <Link key={itemKey} {...commonProps} href={result.link || '#'} onClick={onItemClick}>
            {itemContent}
          </Link>
        )
      })}
    </div>
  )

  if (usePortal && typeof document !== 'undefined') {
    const portalTarget = document.body
    return createPortal(menuContent, portalTarget)
  }

  return menuContent
}
