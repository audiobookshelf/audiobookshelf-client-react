'use client'

import LibraryFilterSelect from '@/app/(main)/library/[library]/LibraryFilterSelect'
import LibrarySortSelect from '@/app/(main)/library/[library]/LibrarySortSelect'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { EntityType, UserLoginResponse } from '@/types/api'
import { useEffect } from 'react'

export function useBookshelfControls(entityType: EntityType, currentUser: UserLoginResponse) {
  const t = useTypeSafeTranslations()
  const { library, setToolbarExtras, setContextMenuItems, setContextMenuActionHandler, updateSetting, showSubtitles, collapseSeries } = useLibrary()

  const isBookLibrary = library.mediaType === 'book'
  const isPodcastLibrary = library.mediaType === 'podcast'

  useEffect(() => {
    // Set up toolbar extras based on entity type
    if (entityType === 'items' || entityType === 'series' || entityType === 'authors') {
      setToolbarExtras(
        <>
          <LibraryFilterSelect user={currentUser.user} entityType={entityType} />
          <LibrarySortSelect entityType={entityType} libraryMediaType={entityType === 'series' ? undefined : library.mediaType} />
        </>
      )
    } else {
      // collections and playlists have no sort/filter
      setToolbarExtras(null)
    }

    // Build context menu items based on entity type
    const menuItems: { text: string; action: string }[] = []

    if (entityType === 'items') {
      if (isBookLibrary) {
        menuItems.push({
          text: showSubtitles ? t('LabelHideSubtitles') : t('LabelShowSubtitles'),
          action: showSubtitles ? 'hide-subtitles' : 'show-subtitles'
        })
        menuItems.push({
          text: collapseSeries ? t('LabelExpandSeries') : t('LabelCollapseSeries'),
          action: collapseSeries ? 'expand-series' : 'collapse-series'
        })
      } else if (isPodcastLibrary) {
        menuItems.push({
          text: t('LabelExportOPML'),
          action: 'export-opml'
        })
      }
    } else if (entityType === 'authors' && currentUser.user.permissions?.update) {
      menuItems.push({
        text: t('ButtonMatchAllAuthors'),
        action: 'match-all-authors'
      })
    }

    setContextMenuItems(menuItems)

    // Set up action handler
    setContextMenuActionHandler((action: string) => {
      if (action === 'show-subtitles') {
        updateSetting('showSubtitles', true)
      } else if (action === 'hide-subtitles') {
        updateSetting('showSubtitles', false)
      } else if (action === 'expand-series') {
        updateSetting('collapseSeries', false)
      } else if (action === 'collapse-series') {
        updateSetting('collapseSeries', true)
      } else if (action === 'match-all-authors') {
        // TODO: Implement match all authors
        console.log('Match all authors - to be implemented')
      } else if (action === 'export-opml') {
        // TODO: Implement export OPML
        console.log('Export OPML - to be implemented')
      }
    })

    return () => {
      setToolbarExtras(null)
      setContextMenuItems([])
    }
  }, [
    entityType,
    setToolbarExtras,
    setContextMenuItems,
    setContextMenuActionHandler,
    updateSetting,
    library.mediaType,
    isBookLibrary,
    isPodcastLibrary,
    showSubtitles,
    collapseSeries,
    currentUser.user,
    t
  ])
}
