'use client'

import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { FoliateSearchSection } from '@/components/ereader/foliate'
import type { EreaderTheme } from '@/lib/ereader/ereaderSettings'
import { EREADER_THEME_SEARCH_INPUT } from '@/lib/ereader/ereaderSettings'
import type { EreaderTocItem } from '@/lib/ereader/ereaderToc'
import { mergeClasses } from '@/lib/merge-classes'
import { FormEvent, useEffect, useState } from 'react'

interface EreaderTocDrawerProps {
  isOpen: boolean
  shellClass: string
  items: EreaderTocItem[]
  supportsSearch: boolean
  searchQuery: string
  searchResults: FoliateSearchSection[]
  isSearchMode: boolean
  isSearchPending: boolean
  searchProgress: number | null
  onSearch: (query: string) => void
  onClose: () => void
  onGoTo: (href: string) => void
  onGoToSearchResult: (cfi: string) => void
  theme: EreaderTheme
}

export default function EreaderTocDrawer({
  isOpen,
  shellClass,
  items,
  supportsSearch,
  searchQuery,
  searchResults,
  isSearchMode,
  isSearchPending,
  searchProgress,
  onSearch,
  onClose,
  onGoTo,
  onGoToSearchResult,
  theme
}: EreaderTocDrawerProps) {
  const t = useTypeSafeTranslations()
  const [draftQuery, setDraftQuery] = useState(searchQuery)

  useEffect(() => {
    if (isOpen) setDraftQuery(searchQuery)
  }, [isOpen, searchQuery])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSearch(draftQuery.trim())
  }

  const handleClear = () => {
    setDraftQuery('')
    onSearch('')
  }

  const searchInputClassNames = EREADER_THEME_SEARCH_INPUT[theme]

  return (
    <>
      {isOpen && <button type="button" className="absolute inset-0 z-20 bg-black/20" onClick={onClose} aria-label={t('ButtonClose')} />}
      <aside
        className={mergeClasses(
          'absolute start-0 top-0 z-30 flex h-full w-96 max-w-full flex-col shadow-xl transition-transform duration-200',
          shellClass,
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-2 flex items-center">
            <button type="button" className="material-symbols text-2xl opacity-80 hover:opacity-100" onClick={onClose} aria-label={t('ButtonClose')}>
              arrow_back
            </button>
            <p className="ms-2 text-lg font-semibold">{t('HeaderTableOfContents')}</p>
          </div>

          {supportsSearch && (
            <form className="mb-2 w-full text-sm" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>
              <TextInput
                value={draftQuery}
                onChange={setDraftQuery}
                onClear={handleClear}
                clearable
                type="search"
                enterKeyHint="search"
                placeholder={t('PlaceholderSearch')}
                className="w-full"
                wrapperClassName={searchInputClassNames.wrapperClassName}
                customInputClass={searchInputClassNames.customInputClass}
                clearButtonClassName={searchInputClassNames.clearButtonClassName}
              />
            </form>
          )}

          {isSearchPending && searchProgress !== null && (
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-black/10">
              <div className="h-full bg-current opacity-50 transition-[width]" style={{ width: `${Math.round(searchProgress * 100)}%` }} />
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isSearchMode ? (
              <SearchResults results={searchResults} isPending={isSearchPending} onGoTo={onGoToSearchResult} noResultsLabel={t('MessageNoResults')} />
            ) : items.length === 0 ? (
              <p className="py-4 text-center text-sm opacity-70">{t('LabelNotAvailable')}</p>
            ) : (
              <ul>
                {items.map((item) => (
                  <TocEntry key={item.id} item={item} onGoTo={onGoTo} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

function SearchResults({
  results,
  isPending,
  onGoTo,
  noResultsLabel
}: {
  results: FoliateSearchSection[]
  isPending: boolean
  onGoTo: (cfi: string) => void
  noResultsLabel: string
}) {
  if (!isPending && results.length === 0) {
    return <p className="py-4 text-center text-xl">{noResultsLabel}</p>
  }

  if (isPending && results.length === 0) {
    return null
  }

  return (
    <ul>
      {results.map((section) => (
        <li key={section.id} className="py-1">
          {section.label ? <p className="opacity-80">{section.label}</p> : null}
          {section.hits.map((hit) => (
            <button
              key={hit.id}
              type="button"
              className="block w-full py-1 ps-4 text-start text-sm opacity-50 hover:opacity-100"
              onClick={() => onGoTo(hit.cfi)}
            >
              {`${hit.excerpt.pre}${hit.excerpt.match}${hit.excerpt.post}`.trim()}
            </button>
          ))}
        </li>
      ))}
    </ul>
  )
}

function TocEntry({ item, onGoTo }: { item: EreaderTocItem; onGoTo: (href: string) => void }) {
  return (
    <li className="py-1">
      <button type="button" className="text-start opacity-80 hover:opacity-100" onClick={() => onGoTo(item.href)}>
        {item.label}
      </button>
      {item.subitems && item.subitems.length > 0 && (
        <ul className="ps-4">
          {item.subitems.map((subitem) => (
            <TocEntry key={subitem.id} item={subitem} onGoTo={onGoTo} />
          ))}
        </ul>
      )}
    </li>
  )
}
