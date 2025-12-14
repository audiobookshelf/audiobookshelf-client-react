'use client'

import InputWrapper from '@/components/ui/InputWrapper'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useLibrarySearch } from '@/hooks/useLibrarySearch'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

import { useGlobalSearchTransformer } from '@/hooks/useGlobalSearchTransformer'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import GlobalSearchMenu from './GlobalSearchMenu'

interface GlobalSearchInputProps {
  libraryId?: string
  autoFocus?: boolean
  onSubmit?: () => void
}

export default function GlobalSearchInput({ libraryId, autoFocus, onSubmit }: GlobalSearchInputProps = {}) {
  const searchOptions = useMemo(() => ({ autoSelectFirst: false, libraryId }), [libraryId])
  const { searchQuery, setSearchQuery, isSearching, searchResults, selectedLibraryId, handleSearch, searchError } = useLibrarySearch(searchOptions)
  const t = useTypeSafeTranslations()
  const router = useRouter()

  // Local state for UI
  const [showMenu, setShowMenu] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isTyping, setIsTyping] = useState(false) // Local typing state for "Thinking..."

  // Debounce search
  useEffect(() => {
    if (!searchQuery) {
      setIsTyping(false)
      return
    }

    setIsTyping(true)
    const timeoutId = setTimeout(() => {
      setIsTyping(false)
      handleSearch()
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, handleSearch])

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useClickOutside(containerRef, containerRef, () => {
    setShowMenu(false)
  })

  const handleInputFocus = () => {
    setShowMenu(true)
  }

  const handleInputBlur = () => {
    setShowMenu(false)
  }

  const flatResults = useGlobalSearchTransformer({
    searchResults,
    searchQuery,
    isSearching,
    isTyping,
    searchError,
    selectedLibraryId
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Skip headers
      let nextIndex = focusedIndex + 1
      while (nextIndex < flatResults.length && (flatResults[nextIndex].type === 'header' || flatResults[nextIndex].isPlaceholder)) {
        nextIndex++
      }
      if (nextIndex < flatResults.length) {
        setFocusedIndex(nextIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      let prevIndex = focusedIndex - 1
      while (prevIndex >= 0 && (flatResults[prevIndex].type === 'header' || flatResults[prevIndex].isPlaceholder)) {
        prevIndex--
      }
      if (prevIndex >= 0) {
        setFocusedIndex(prevIndex)
      } else if (prevIndex < 0) {
        setFocusedIndex(-1) // Allow going back to input
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIndex >= 0 && flatResults[focusedIndex]) {
        const item = flatResults[focusedIndex]
        if (item.link) {
          router.push(item.link)
          setShowMenu(false)
          inputRef.current?.blur()
          onSubmit?.()
        }
      } else if (searchQuery.trim()) {
        router.push(`/library/${selectedLibraryId}/search?q=${encodeURIComponent(searchQuery.trim())}`)
        setShowMenu(false)
        inputRef.current?.blur()
        onSubmit?.()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowMenu(false)
      inputRef.current?.blur()
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    setFocusedIndex(-1)
    inputRef.current?.focus()
  }

  const handleResultClick = () => {
    setShowMenu(false)
    onSubmit?.()
  }

  return (
    <div className="w-full relative sm:w-80" ref={containerRef}>
      <InputWrapper size="small" borderless className="w-full" inputRef={inputRef}>
        <input
          ref={inputRef}
          type="text"
          className="w-full h-full bg-transparent outline-none text-sm placeholder:text-gray-400"
          placeholder={t('PlaceholderSearch')}
          value={searchQuery}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showMenu}
          aria-haspopup="listbox"
          aria-controls="global-search-menu"
          aria-activedescendant={focusedIndex >= 0 ? `result-item-${focusedIndex}` : undefined}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          autoFocus={autoFocus}
        />
      </InputWrapper>

      {/* Search Icon, Spinner or Clear Button */}
      <div className="absolute end-0 top-0 h-full flex items-center pe-2">
        {isSearching || isTyping ? (
          <LoadingSpinner size="la-sm" className="scale-50 text-gray-400" />
        ) : searchQuery ? (
          <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer" aria-label="Clear search">
            <span className="material-symbols text-lg">close</span>
          </button>
        ) : (
          <span className="material-symbols text-gray-400 text-lg pointer-events-none">search</span>
        )}
      </div>

      {/* Dropdown Menu */}
      {showMenu && (searchQuery || isSearching || isTyping) && (
        <GlobalSearchMenu results={flatResults} focusedIndex={focusedIndex} onItemClick={handleResultClick} menuRef={menuRef} searchQuery={searchQuery} />
      )}
    </div>
  )
}
