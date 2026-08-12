import type { TypeSafeTranslations } from '@/types/translations'

export interface SettingsNavItemDef {
  messageKey:
    | 'HeaderSettingsGeneral'
    | 'HeaderLibraries'
    | 'HeaderUsers'
    | 'HeaderApiKeys'
    | 'HeaderListeningSessions'
    | 'HeaderBackups'
    | 'HeaderLogs'
    | 'HeaderNotifications'
    | 'HeaderEmail'
    | 'HeaderItemMetadataUtils'
    | 'HeaderRSSFeeds'
    | 'HeaderAuthentication'
  href: string
}

export const SETTINGS_NAV_ITEMS: SettingsNavItemDef[] = [
  { messageKey: 'HeaderSettingsGeneral', href: '/settings/general' },
  { messageKey: 'HeaderLibraries', href: '/settings/libraries' },
  { messageKey: 'HeaderUsers', href: '/settings/users' },
  { messageKey: 'HeaderApiKeys', href: '/settings/api-keys' },
  { messageKey: 'HeaderListeningSessions', href: '/settings/listening-sessions' },
  { messageKey: 'HeaderBackups', href: '/settings/backups' },
  { messageKey: 'HeaderLogs', href: '/settings/logs' },
  { messageKey: 'HeaderNotifications', href: '/settings/notifications' },
  { messageKey: 'HeaderEmail', href: '/settings/email' },
  { messageKey: 'HeaderItemMetadataUtils', href: '/settings/item-metadata-utils' },
  { messageKey: 'HeaderRSSFeeds', href: '/settings/rss-feeds' },
  { messageKey: 'HeaderAuthentication', href: '/settings/authentication' }
]

export const SETTINGS_HUB_PATH = '/settings'

const USER_LISTENING_SESSIONS_PATH_PREFIX = '/settings/listening-sessions/'

interface SettingsDrillDownDef {
  pathPrefix: string
  backHref: string
  titleMessageKey: 'HeaderUser' | 'HeaderListeningSessions' | 'HeaderManageTags' | 'HeaderManageGenres' | 'HeaderCustomMetadataProviders'
}

const SETTINGS_DRILL_DOWN_ROUTES: SettingsDrillDownDef[] = [
  { pathPrefix: '/settings/users/', backHref: '/settings/users', titleMessageKey: 'HeaderUser' },
  { pathPrefix: USER_LISTENING_SESSIONS_PATH_PREFIX, backHref: '/settings/users', titleMessageKey: 'HeaderListeningSessions' },
  { pathPrefix: '/settings/item-metadata-utils/tags', backHref: '/settings/item-metadata-utils', titleMessageKey: 'HeaderManageTags' },
  { pathPrefix: '/settings/item-metadata-utils/genres', backHref: '/settings/item-metadata-utils', titleMessageKey: 'HeaderManageGenres' },
  {
    pathPrefix: '/settings/item-metadata-utils/custom-metadata-providers',
    backHref: '/settings/item-metadata-utils',
    titleMessageKey: 'HeaderCustomMetadataProviders'
  }
]

export function getLibraryBackHref(lastCurrentLibraryId: string | null, userDefaultLibraryId: string | undefined): string {
  const libraryId = lastCurrentLibraryId || userDefaultLibraryId
  if (libraryId) {
    return `/library/${libraryId}`
  }
  return '/library'
}

export function isUserScopedListeningSessionsPath(pathname: string): boolean {
  return pathname.startsWith(USER_LISTENING_SESSIONS_PATH_PREFIX)
}

function getUserListeningSessionsBackHref(pathname: string): string {
  const userId = pathname.slice(USER_LISTENING_SESSIONS_PATH_PREFIX.length).split('/')[0]
  return userId ? `/settings/users/${userId}` : '/settings/users'
}

function getDrillDownBackHref(pathname: string, drillDown: SettingsDrillDownDef): string {
  if (drillDown.pathPrefix === USER_LISTENING_SESSIONS_PATH_PREFIX) {
    return getUserListeningSessionsBackHref(pathname)
  }
  return drillDown.backHref
}

export interface SettingsAppBarMeta {
  backHref: string
  title: string
}

export function getSettingsBackHref(lastNonSettingsPath: string | null, lastCurrentLibraryId: string | null, userDefaultLibraryId: string | undefined): string {
  if (lastNonSettingsPath) {
    return lastNonSettingsPath
  }
  return getLibraryBackHref(lastCurrentLibraryId, userDefaultLibraryId)
}

export function getSettingsAppBarMeta(
  pathname: string,
  isMobile: boolean,
  t: TypeSafeTranslations,
  lastNonSettingsPath: string | null,
  lastCurrentLibraryId: string | null,
  userDefaultLibraryId: string | undefined
): SettingsAppBarMeta {
  const settingsBackHref = getSettingsBackHref(lastNonSettingsPath, lastCurrentLibraryId, userDefaultLibraryId)

  if (!isMobile) {
    return {
      backHref: settingsBackHref,
      title: t('HeaderSettings')
    }
  }

  if (pathname === SETTINGS_HUB_PATH) {
    return {
      backHref: settingsBackHref,
      title: t('HeaderSettings')
    }
  }

  for (const drillDown of SETTINGS_DRILL_DOWN_ROUTES) {
    const isDrillDownRoute = pathname === drillDown.pathPrefix || (drillDown.pathPrefix.endsWith('/') && pathname.startsWith(drillDown.pathPrefix))
    if (isDrillDownRoute) {
      return {
        backHref: getDrillDownBackHref(pathname, drillDown),
        title: t(drillDown.titleMessageKey)
      }
    }
  }

  const navItem = SETTINGS_NAV_ITEMS.find((item) => item.href === pathname)
  if (navItem) {
    return {
      backHref: SETTINGS_HUB_PATH,
      title: t(navItem.messageKey)
    }
  }

  return {
    backHref: SETTINGS_HUB_PATH,
    title: t('HeaderSettings')
  }
}

export function isSettingsNavItemActive(pathname: string, itemHref: string): boolean {
  const isUserScopedListeningSessions = isUserScopedListeningSessionsPath(pathname)
  return pathname === itemHref && !(itemHref === '/settings/listening-sessions' && isUserScopedListeningSessions)
}
